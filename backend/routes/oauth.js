const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { authLimiter } = require('../middleware/rate-limit');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';

// ─── Available Providers ───
// Frontend checks which OAuth providers the backend has configured
router.get('/providers', (req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID,
    microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    apple: !!process.env.APPLE_CLIENT_ID,
    // Send Google Client ID so frontend can initialise Google Sign-In
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID || null,
    appleClientId: process.env.APPLE_CLIENT_ID || null,
  });
});

/**
 * Find or create a user from OAuth profile data.
 * If the email already exists, link the OAuth provider.
 * If not, create a new user (no password needed).
 */
async function findOrCreateOAuthUser(email, name, provider, providerId) {
  let user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];

  if (user) {
    // Update OAuth provider info if not set
    if (!user.oauth_provider) {
      await db.query('UPDATE users SET oauth_provider = $1, oauth_id = $2, email_verified = 1 WHERE id = $3',
        [provider, providerId, user.id]);
    }
  } else {
    // Create new user — random password since they use OAuth
    const randomPass = crypto.randomBytes(32).toString('hex');
    const result = await db.query(
      'INSERT INTO users (name, email, password, email_verified, oauth_provider, oauth_id) VALUES ($1, $2, $3, 1, $4, $5) RETURNING id',
      [name, email, randomPass, provider, providerId]
    );
    user = (await db.query('SELECT * FROM users WHERE id = $1', [result.rows[0].id])).rows[0];
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

// ─── Google OAuth ───
// Frontend sends the Google ID token (from Google Sign-In)
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID token mungon' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'Google OAuth nuk është konfiguruar' });

    // Verify the Google ID token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Token i pavlefshëm nga Google' });
    }

    const result = await findOrCreateOAuthUser(
      payload.email,
      payload.name || payload.email.split('@')[0],
      'google',
      payload.sub
    );

    res.json(result);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(401).json({ error: 'Autentifikimi me Google dështoi' });
  }
});

// ─── Microsoft OAuth ───
// Frontend sends the authorization code from Microsoft
router.post('/microsoft', authLimiter, async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code mungon' });

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Microsoft OAuth nuk është konfiguruar' });
    }

    console.log('Microsoft OAuth: exchanging code, redirectUri =', redirectUri);

    // Exchange code for token using native https
    const https = require('https');
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'openid email profile',
    }).toString();

    const tokenData = await new Promise((resolve, reject) => {
      const req = https.request('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(tokenBody) },
      }, (resp) => {
        let body = '';
        resp.on('data', (c) => body += c);
        resp.on('end', () => {
          try { resolve({ status: resp.statusCode, data: JSON.parse(body) }); }
          catch { reject(new Error('Invalid JSON from Microsoft token endpoint: ' + body.slice(0, 200))); }
        });
      });
      req.on('error', reject);
      req.write(tokenBody);
      req.end();
    });

    if (tokenData.status !== 200 || !tokenData.data.access_token) {
      const desc = tokenData.data.error_description || tokenData.data.error || 'Token exchange failed';
      console.error('Microsoft token error:', desc);
      return res.status(401).json({ error: desc });
    }

    const accessToken = tokenData.data.access_token;

    // Get user info from Microsoft Graph
    const profileData = await new Promise((resolve, reject) => {
      https.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }, (resp) => {
        let body = '';
        resp.on('data', (c) => body += c);
        resp.on('end', () => {
          try { resolve({ status: resp.statusCode, data: JSON.parse(body) }); }
          catch { reject(new Error('Invalid JSON from MS Graph: ' + body.slice(0, 200))); }
        });
      }).on('error', reject);
    });

    if (profileData.status !== 200) {
      console.error('MS Graph error:', profileData.data);
      return res.status(401).json({ error: 'Nuk u mor profili nga Microsoft: ' + (profileData.data.error?.message || 'Unknown') });
    }

    const profile = profileData.data;
    if (!profile.mail && !profile.userPrincipalName) {
      return res.status(400).json({ error: 'Nuk u mor email-i nga Microsoft' });
    }

    const email = profile.mail || profile.userPrincipalName;
    const result = await findOrCreateOAuthUser(
      email,
      profile.displayName || email.split('@')[0],
      'microsoft',
      profile.id
    );

    res.json(result);
  } catch (err) {
    console.error('Microsoft OAuth error:', err.message || err);
    res.status(401).json({ error: 'Autentifikimi me Microsoft dështoi: ' + (err.message || 'Unknown') });
  }
});

// ─── Apple OAuth ───
// Apple uses form_post: it POSTs id_token + code directly to our callback URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.post('/apple/callback', async (req, res) => {
  try {
    const { id_token: idToken, code, user: userStr } = req.body;
    if (!idToken) {
      return res.redirect(`${FRONTEND_URL}/auth/apple/callback?error=${encodeURIComponent('Token mungon nga Apple')}`);
    }

    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) {
      return res.redirect(`${FRONTEND_URL}/auth/apple/callback?error=${encodeURIComponent('Apple OAuth nuk është konfiguruar')}`);
    }

    // Parse user info (Apple sends it as JSON string, only on first login)
    let appleUser;
    if (userStr) {
      try { appleUser = typeof userStr === 'string' ? JSON.parse(userStr) : userStr; } catch { /* ignore */ }
    }

    // Fetch Apple's public keys
    const axios = require('axios');
    const { createPublicKey } = require('crypto');

    const keysRes = await axios.get('https://appleid.apple.com/auth/keys', { timeout: 5000 });
    const appleKeys = keysRes.data.keys;

    // Decode JWT header to find the right key
    const headerPart = idToken.split('.')[0];
    if (!headerPart) {
      return res.redirect(`${FRONTEND_URL}/auth/apple/callback?error=${encodeURIComponent('Token i pavlefshëm')}`);
    }
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString());

    const appleKey = appleKeys.find(k => k.kid === header.kid);
    if (!appleKey) {
      return res.redirect(`${FRONTEND_URL}/auth/apple/callback?error=${encodeURIComponent('Çelësi publik nuk u gjet')}`);
    }

    const publicKey = createPublicKey({ key: appleKey, format: 'jwk' });

    const payload = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    });

    if (!payload.email) {
      return res.redirect(`${FRONTEND_URL}/auth/apple/callback?error=${encodeURIComponent('Nuk u mor email-i nga Apple')}`);
    }

    const name = appleUser?.name
      ? `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim()
      : payload.email.split('@')[0];

    const result = await findOrCreateOAuthUser(
      payload.email,
      name,
      'apple',
      payload.sub
    );

    // Redirect to frontend with token in URL fragment (not exposed to server logs)
    res.redirect(`${FRONTEND_URL}/auth/apple/callback?token=${result.token}`);
  } catch (err) {
    console.error('Apple OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/auth/apple/callback?error=${encodeURIComponent('Autentifikimi me Apple dështoi')}`);
  }
});

module.exports = router;

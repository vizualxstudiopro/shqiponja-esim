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
function findOrCreateOAuthUser(email, name, provider, providerId) {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user) {
    // Update OAuth provider info if not set
    if (!user.oauth_provider) {
      db.prepare('UPDATE users SET oauth_provider = ?, oauth_id = ?, email_verified = 1 WHERE id = ?')
        .run(provider, providerId, user.id);
    }
  } else {
    // Create new user — random password since they use OAuth
    const randomPass = crypto.randomBytes(32).toString('hex');
    const result = db.prepare(
      'INSERT INTO users (name, email, password, email_verified, oauth_provider, oauth_id) VALUES (?, ?, ?, 1, ?, ?)'
    ).run(name, email, randomPass, provider, providerId);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
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

    const result = findOrCreateOAuthUser(
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

    // Exchange code for token
    const axios = require('axios');
    const tokenRes = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid email profile',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;

    // Get user info
    const userRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = userRes.data;
    if (!profile.mail && !profile.userPrincipalName) {
      return res.status(400).json({ error: 'Nuk u mor email-i nga Microsoft' });
    }

    const email = profile.mail || profile.userPrincipalName;
    const result = findOrCreateOAuthUser(
      email,
      profile.displayName || email.split('@')[0],
      'microsoft',
      profile.id
    );

    res.json(result);
  } catch (err) {
    console.error('Microsoft OAuth error:', err);
    res.status(401).json({ error: 'Autentifikimi me Microsoft dështoi' });
  }
});

// ─── Apple OAuth ───
// Frontend sends the authorization code + user info from Apple Sign-In
router.post('/apple', authLimiter, async (req, res) => {
  try {
    const { code, idToken, user: appleUser } = req.body;
    if (!idToken && !code) return res.status(400).json({ error: 'Token ose code mungon' });

    // Decode Apple ID token (JWT) to get user info
    // Apple ID tokens are signed JWTs — we decode the payload
    const parts = (idToken || '').split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Token i pavlefshëm nga Apple' });
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.email) {
      return res.status(400).json({ error: 'Nuk u mor email-i nga Apple' });
    }

    // Apple only sends user name on first login
    const name = appleUser?.name
      ? `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim()
      : payload.email.split('@')[0];

    const result = findOrCreateOAuthUser(
      payload.email,
      name,
      'apple',
      payload.sub
    );

    res.json(result);
  } catch (err) {
    console.error('Apple OAuth error:', err);
    res.status(401).json({ error: 'Autentifikimi me Apple dështoi' });
  }
});

module.exports = router;

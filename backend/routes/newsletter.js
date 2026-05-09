const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { validateEmail } = require('../middleware/validate');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rate-limit');
const { sendMail } = require('../src/utils/email');
const { syncBrevoContact, removeFromBrevoList } = require('../src/services/brevoContacts');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://shqiponjaesim.com';
const BRAND_RED = '#C8102E';
const NEWSLETTER_LIST_ID = process.env.BREVO_NEWSLETTER_LIST_ID;

function createBrevoRequest(apiKey) {
  return function brevoRequest(method, path, body) {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const headers = {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      };
      if (data) headers['Content-Length'] = Buffer.byteLength(data);
      const req = require('https').request(
        { hostname: 'api.brevo.com', port: 443, path, method, headers },
        (r) => {
          let chunks = '';
          r.on('data', c => { chunks += c; });
          r.on('end', () => {
            try { resolve({ status: r.statusCode, body: JSON.parse(chunks) }); }
            catch { resolve({ status: r.statusCode, body: chunks }); }
          });
        }
      );
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  };
}

async function getBrevoListEmails(brevoRequest, listId, max = 300) {
  if (!listId) return [];
  const limit = 100;
  let offset = 0;
  const emails = [];
  while (emails.length < max) {
    const path = `/v3/contacts/lists/${encodeURIComponent(listId)}/contacts?limit=${limit}&offset=${offset}`;
    const r = await brevoRequest('GET', path);
    if (r.status !== 200) {
      throw new Error(`List contacts failed (${listId}): ${r.status} ${JSON.stringify(r.body)}`);
    }
    const contacts = Array.isArray(r.body?.contacts) ? r.body.contacts : [];
    if (!contacts.length) break;
    for (const c of contacts) {
      if (c?.email) emails.push(c.email);
      if (emails.length >= max) break;
    }
    if (contacts.length < limit) break;
    offset += limit;
  }
  return Array.from(new Set(emails));
}

function buildWelcomeNewsletterHtml(unsubscribeUrl, locale) {
  const isSq = locale !== 'en';
  return `<!DOCTYPE html>
<html lang="${isSq ? 'sq' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${isSq ? 'Mirë se vjen te Shqiponja eSIM!' : 'Welcome to Shqiponja eSIM!'}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <tr><td style="background:#C8102E;padding:28px 32px;text-align:center">
      <span style="font-size:24px;font-weight:800;color:#fff">🦅 Shqiponja eSIM</span>
    </td></tr>
    <tr><td style="padding:32px">
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b">${isSq ? '🎉 Mirë se vjen në listën tonë!' : '🎉 Welcome to our newsletter!'}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#52525b;line-height:1.7">${isSq ? 'Faleminderit që u abone! Do të marrësh ofertat tona më të mira, destinacione të reja eSIM dhe promocione ekskluzive direkt në inbox-in tënd.' : 'Thanks for subscribing! You\'ll receive our best offers, new eSIM destinations and exclusive deals straight to your inbox.'}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px">
        <a href="${FRONTEND_URL}/paketa" style="display:inline-block;background:#C8102E;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px">${isSq ? 'Shiko paketat →' : 'Browse packages →'}</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:0 32px 24px;text-align:center">
      <p style="margin:0;font-size:11px;color:#d4d4d8">${isSq ? 'Nuk dëshiron email?' : 'Don\'t want emails?'} <a href="${unsubscribeUrl}" style="color:#a1a1aa">${isSq ? 'Çregjistrohu' : 'Unsubscribe'}</a></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

function buildCampaignHtml(subject, bodyHtml, unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>
  body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .btn{display:inline-block;background:${BRAND_RED};color:#ffffff!important;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:15px}
  @media only screen and (max-width:600px){.container{width:100%!important;padding:0 16px!important}}
</style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <tr>
      <td style="background:${BRAND_RED};padding:28px 32px;text-align:center">
        <span style="font-size:24px;font-weight:800;color:#ffffff">🦅 Shqiponja eSIM</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 24px">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 28px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding-top:20px;text-align:center">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa">
                <a href="${FRONTEND_URL}" style="color:${BRAND_RED};text-decoration:none;font-weight:600">shqiponjaesim.com</a>
              </p>
              <p style="margin:0 0 12px;font-size:11px;color:#a1a1aa">
                <a href="${FRONTEND_URL}/kushtet" style="color:#a1a1aa;text-decoration:none">Kushtet</a> &nbsp;·&nbsp;
                <a href="${FRONTEND_URL}/privatesia" style="color:#a1a1aa;text-decoration:none">Privatësia</a> &nbsp;·&nbsp;
                <a href="${FRONTEND_URL}/kontakti" style="color:#a1a1aa;text-decoration:none">Kontakti</a>
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:#d4d4d8">
                Nuk dëshiron të marrësh email? <a href="${unsubscribeUrl}" style="color:#a1a1aa">Çregjistrohu</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

// POST /api/newsletter/subscribe
router.post('/subscribe', apiLimiter, async (req, res) => {
  const { email, locale } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }
  const safeEmail = String(email).trim().toLowerCase().slice(0, 254);
  const safeLocale = ['sq', 'en'].includes(locale) ? locale : 'sq';

  const unsubscribeToken = crypto.randomBytes(24).toString('hex');
  try {
    const insertResult = await db.query(`
      INSERT INTO newsletter_subscribers (email, locale, unsubscribe_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
        SET locale = EXCLUDED.locale,
            unsubscribed_at = NULL,
            subscribed_at = NOW()
      WHERE newsletter_subscribers.unsubscribed_at IS NOT NULL
        OR newsletter_subscribers.email = EXCLUDED.email
      RETURNING unsubscribe_token
    `, [safeEmail, safeLocale, unsubscribeToken]);

    // Get the actual token stored (may differ if row already existed)
    const storedToken = insertResult.rows[0]?.unsubscribe_token || unsubscribeToken;
    const unsubscribeUrl = `${FRONTEND_URL}/api/newsletter/unsubscribe?token=${storedToken}`;

    // Sync to Brevo Contacts (non-blocking)
    syncBrevoContact(
      safeEmail,
      { LOCALE: safeLocale },
      NEWSLETTER_LIST_ID ? [NEWSLETTER_LIST_ID] : []
    ).catch(() => {});

    // Send welcome email (non-blocking)
    sendMail(
      safeEmail,
      safeLocale === 'en' ? 'Welcome to Shqiponja eSIM newsletter!' : 'Mirë se vjen te newsletter-i i Shqiponja eSIM!',
      buildWelcomeNewsletterHtml(unsubscribeUrl, safeLocale),
    ).catch(err => console.error('[NEWSLETTER WELCOME] Failed:', err.message));

    res.json({ ok: true });
  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    res.status(500).json({ error: 'Gabim gjatë regjistrimit' });
  }
});

// GET /api/newsletter/unsubscribe?token=...
router.get('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string' || !/^[0-9a-f]{48}$/.test(token)) {
    return res.status(400).send('<h2>Token i pavlefshëm</h2>');
  }
  try {
    const result = await db.query(
      'UPDATE newsletter_subscribers SET unsubscribed_at = NOW() WHERE unsubscribe_token = $1 RETURNING email',
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('<h2>Token nuk u gjet</h2>');
    }
    // Remove from Brevo list (non-blocking)
    if (NEWSLETTER_LIST_ID && result.rows[0]?.email) {
      removeFromBrevoList(result.rows[0].email, NEWSLETTER_LIST_ID).catch(() => {});
    }
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Çregjistrim</title><style>body{font-family:sans-serif;text-align:center;padding:60px;background:#f4f4f5}h1{color:#c8102e}p{color:#52525b}</style></head><body><h1>🦅 Shqiponja eSIM</h1><h2>U çregjistrove nga newsletter-i.</h2><p>Email-i juaj u hoq nga lista jonë e postimeve.</p><p><a href="${process.env.FRONTEND_URL || 'https://shqiponjaesim.com'}">Kthehu në faqe</a></p></body></html>`);
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err.message);
    res.status(500).send('<h2>Gabim i brendshëm</h2>');
  }
});

// GET /api/newsletter/subscribers — Admin only
router.get('/subscribers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const total = parseInt((await db.query("SELECT COUNT(*) c FROM newsletter_subscribers WHERE unsubscribed_at IS NULL")).rows[0].c);
    const rows = (await db.query(
      "SELECT id, email, locale, subscribed_at FROM newsletter_subscribers WHERE unsubscribed_at IS NULL ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    )).rows;
    res.json({ subscribers: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Gabim serveri' });
  }
});

// POST /api/newsletter/broadcast — Admin only
// Body: { subject, bodyHtml, locale? ('sq'|'en'|'all') }
router.post('/broadcast', authMiddleware, adminOnly, async (req, res) => {
  const { subject, bodyHtml, locale } = req.body;

  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
    return res.status(400).json({ error: 'Subjekti duhet të jetë të paktën 3 karaktere' });
  }
  if (!bodyHtml || typeof bodyHtml !== 'string' || bodyHtml.trim().length < 10) {
    return res.status(400).json({ error: 'Përmbajtja duhet të jetë të paktën 10 karaktere' });
  }

  const safeLocale = ['sq', 'en'].includes(locale) ? locale : null;

  try {
    // Fetch all active subscribers (optionally filtered by locale)
    const query = safeLocale
      ? "SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE unsubscribed_at IS NULL AND locale = $1"
      : "SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE unsubscribed_at IS NULL";
    const params = safeLocale ? [safeLocale] : [];
    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.json({ sent: 0, failed: 0, total: 0, message: 'Nuk ka abonentë aktivë' });
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Send with small delay between batches to stay within Brevo free tier (300/day)
    for (let i = 0; i < rows.length; i++) {
      const { email, unsubscribe_token } = rows[i];
      const unsubscribeUrl = `${FRONTEND_URL}/api/newsletter/unsubscribe?token=${unsubscribe_token}`;
      const html = buildCampaignHtml(subject.trim(), bodyHtml.trim(), unsubscribeUrl);
      try {
        await sendMail(email, subject.trim(), html);
        sent++;
      } catch (err) {
        failed++;
        errors.push({ email, error: err.message });
        console.error(`[BROADCAST] Failed to send to ${email}:`, err.message);
      }
      // Small delay every 10 emails to avoid rate limits
      if ((i + 1) % 10 === 0 && i + 1 < rows.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[BROADCAST] Subject: "${subject}" | Sent: ${sent} | Failed: ${failed} | Total: ${rows.length}`);
    res.json({ sent, failed, total: rows.length, errors: errors.slice(0, 10) });
  } catch (err) {
    console.error('Newsletter broadcast error:', err.message);
    res.status(500).json({ error: 'Gabim gjatë dërgimit' });
  }
});

// POST /api/newsletter/brevo-setup — Admin only
// Creates Brevo lists and bulk-syncs all existing subscribers + users
router.post('/brevo-setup', authMiddleware, adminOnly, async (req, res) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    return res.status(400).json({ error: 'BREVO_API_KEY nuk është vendosur' });
  }
  const brevoRequest = createBrevoRequest(BREVO_API_KEY);

  async function getOrCreateFolderId() {
    // Try to get existing folders
    const r = await brevoRequest('GET', '/v3/contacts/folders?limit=50');
    if (r.status === 200 && r.body?.folders?.length) {
      return r.body.folders[0].id; // use first existing folder
    }
    // Create a folder if none exist
    const c = await brevoRequest('POST', '/v3/contacts/folders', { name: 'Shqiponja eSIM' });
    if (c.status === 201) return c.body.id;
    throw new Error(`Could not get/create Brevo folder: ${c.status} ${JSON.stringify(c.body)}`);
  }

  async function createList(name, folderId) {
    // First check if list with this name already exists
    const all = await brevoRequest('GET', '/v3/contacts/lists?limit=50');
    if (all.status === 200 && all.body?.lists) {
      const found = all.body.lists.find(l => l.name === name);
      if (found) return found.id;
    }
    // Create new list
    const r = await brevoRequest('POST', '/v3/contacts/lists', { name, folderId });
    if (r.status === 201) return r.body.id;
    if (r.status === 400 && r.body?.code === 'duplicate_parameter') {
      const all2 = await brevoRequest('GET', '/v3/contacts/lists?limit=50');
      const found = all2.body?.lists?.find(l => l.name === name);
      return found ? found.id : null;
    }
    throw new Error(`Create list failed: ${r.status} ${JSON.stringify(r.body)}`);
  }

  async function bulkAddToList(emails, listId) {
    if (!emails.length || !listId) return { count: 0 };
    // Brevo bulk import — up to 150 emails per call
    let added = 0;
    for (let i = 0; i < emails.length; i += 150) {
      const batch = emails.slice(i, i + 150).map(e => ({ email: e }));
      const r = await brevoRequest('POST', '/v3/contacts/import', {
        jsonBody: batch,
        listIds: [listId],
        updateExistingContacts: true,
        emptyContactsAttributes: false,
      });
      if (r.status === 202) added += batch.length;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return { count: added };
  }

  try {
    // 1. Get or create folder, then create/get lists
    const folderId = await getOrCreateFolderId();
    const newsletterListId = await createList('Newsletter Subscribers', folderId);
    const usersListId = await createList('Registered Users', folderId);

    // 2. Fetch existing newsletter subscribers
    const { rows: subs } = await db.query(
      "SELECT email FROM newsletter_subscribers WHERE unsubscribed_at IS NULL"
    );
    // 3. Fetch existing registered users
    const { rows: users } = await db.query("SELECT email FROM users");

    // 4. Bulk sync
    const subEmails = subs.map(r => r.email);
    const userEmails = users.map(r => r.email);
    const [subResult, userResult] = await Promise.all([
      bulkAddToList(subEmails, newsletterListId),
      bulkAddToList(userEmails, usersListId),
    ]);

    console.log(`[BREVO SETUP] Newsletter list: ${newsletterListId} (${subResult.count} contacts)`);
    console.log(`[BREVO SETUP] Users list: ${usersListId} (${userResult.count} contacts)`);

    res.json({
      newsletterListId,
      usersListId,
      subscribersSynced: subResult.count,
      usersSynced: userResult.count,
      message: `Vendos këto në Railway: BREVO_NEWSLETTER_LIST_ID=${newsletterListId} dhe BREVO_USERS_LIST_ID=${usersListId}`,
    });
  } catch (err) {
    console.error('[BREVO SETUP] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/newsletter/brevo-contacts — Admin only
// Reads first contacts from configured Brevo lists so admin can see synced emails.
router.get('/brevo-contacts', authMiddleware, adminOnly, async (req, res) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const newsletterListId = process.env.BREVO_NEWSLETTER_LIST_ID;
  const usersListId = process.env.BREVO_USERS_LIST_ID;
  if (!BREVO_API_KEY) return res.status(400).json({ error: 'BREVO_API_KEY nuk është vendosur' });

  try {
    const brevoRequest = createBrevoRequest(BREVO_API_KEY);
    const [newsletterEmails, userEmails] = await Promise.all([
      getBrevoListEmails(brevoRequest, newsletterListId),
      getBrevoListEmails(brevoRequest, usersListId),
    ]);
    res.json({
      newsletterListId: newsletterListId ? Number(newsletterListId) : null,
      usersListId: usersListId ? Number(usersListId) : null,
      newsletterEmails,
      userEmails,
    });
  } catch (err) {
    console.error('[BREVO CONTACTS] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

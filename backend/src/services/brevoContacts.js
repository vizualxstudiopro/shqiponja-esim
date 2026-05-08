/**
 * Brevo Contacts API — sync users & newsletter subscribers
 *
 * Env vars needed (set in Railway):
 *   BREVO_API_KEY             — your Brevo API key (already set)
 *   BREVO_NEWSLETTER_LIST_ID  — Brevo list ID for newsletter subscribers (e.g. 3)
 *   BREVO_USERS_LIST_ID       — Brevo list ID for registered users (e.g. 4)
 *
 * How to find List IDs:
 *   Brevo dashboard → Contacts → Lists → click a list → the ID is in the URL
 */

const https = require('https');

const BREVO_API_KEY = process.env.BREVO_API_KEY;

/**
 * Create or update a Brevo contact.
 * If the contact already exists it is updated (updateEnabled: true).
 *
 * @param {string} email
 * @param {{ FIRSTNAME?: string, LASTNAME?: string, [key: string]: string|number|boolean }} attributes
 * @param {number[]} listIds  — Brevo list IDs to add this contact to
 * @returns {Promise<void>}
 */
async function syncBrevoContact(email, attributes = {}, listIds = []) {
  if (!BREVO_API_KEY) {
    console.log('[BREVO CONTACTS] Skipping — BREVO_API_KEY not set');
    return;
  }
  if (!email) return;

  const validListIds = listIds
    .map(id => parseInt(id, 10))
    .filter(id => !isNaN(id) && id > 0);

  const body = JSON.stringify({
    email: email.trim().toLowerCase(),
    attributes,
    listIds: validListIds.length ? validListIds : undefined,
    updateEnabled: true,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/contacts',
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 201 || res.statusCode === 204) {
            console.log(`[BREVO CONTACTS] Synced ${email} → lists [${validListIds.join(', ')}]`);
          } else if (res.statusCode === 400) {
            // 400 often means "already exists" with duplicate data — not an error
            console.log(`[BREVO CONTACTS] Contact ${email} already up-to-date`);
          } else {
            console.error(`[BREVO CONTACTS] Error ${res.statusCode} for ${email}:`, data.slice(0, 200));
          }
          resolve();
        });
      }
    );
    req.on('error', (err) => {
      console.error('[BREVO CONTACTS] Request failed:', err.message);
      resolve(); // never throw — contact sync is non-critical
    });
    req.write(body);
    req.end();
  });
}

/**
 * Remove a contact from a specific list (unsubscribe).
 * Does NOT delete the contact — just removes from the list.
 *
 * @param {string} email
 * @param {number} listId
 */
async function removeFromBrevoList(email, listId) {
  if (!BREVO_API_KEY || !email || !listId) return;

  const body = JSON.stringify({ emails: [email.trim().toLowerCase()] });
  const lid = parseInt(listId, 10);
  if (isNaN(lid) || lid <= 0) return;

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        port: 443,
        path: `/v3/contacts/lists/${lid}/contacts/remove`,
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[BREVO CONTACTS] Removed ${email} from list ${lid}`);
          } else {
            console.error(`[BREVO CONTACTS] Remove error ${res.statusCode}:`, data.slice(0, 200));
          }
          resolve();
        });
      }
    );
    req.on('error', (err) => {
      console.error('[BREVO CONTACTS] Remove request failed:', err.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

module.exports = { syncBrevoContact, removeFromBrevoList };

const express = require('express');
const db = require('../db');
const EAGLE_TEAM = require('../src/data/eagle-team');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

const avatarCache = {
  expiresAt: 0,
  items: null,
};

const AVATAR_CACHE_MS = 5 * 60 * 1000;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

function makeSvgDataUri(name, accent) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const color = accent || '#C8102E';
  const svg = `<svg width="480" height="640" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#09090b"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="240" cy="290" r="130" fill="${color}" opacity="0.18"/><circle cx="240" cy="290" r="92" fill="${color}" opacity="0.28"/><text x="50%" y="50%" font-family="Georgia, serif" font-size="160" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="middle">${initial}</text><text x="50%" y="560" font-family="Arial, sans-serif" font-size="26" fill="#e4e4e7" text-anchor="middle">${name}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function generateImageFromProvider(prompt) {
  if (!GEMINI_KEY) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  });

  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const bytes = payload?.predictions?.[0]?.bytesBase64Encoded;
  if (!bytes) return null;
  return `data:image/png;base64,${bytes}`;
}

async function upsertAvatarAsset(persona, imageData) {
  const existing = (await db.query('SELECT id FROM avatar_assets WHERE persona_key = $1', [persona.key])).rows[0];
  if (existing) {
    await db.query(
      'UPDATE avatar_assets SET name = $1, role = $2, region = $3, prompt = $4, image_data = $5, updated_at = NOW() WHERE id = $6',
      [persona.name, persona.role, persona.region, persona.prompt, imageData, existing.id]
    );
    return;
  }

  await db.query(
    `INSERT INTO avatar_assets (persona_key, name, role, region, prompt, image_data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [persona.key, persona.name, persona.role, persona.region, persona.prompt, imageData]
  );
}

async function ensureAvatarAssets(forceRefresh = false) {
  if (!forceRefresh && avatarCache.items && Date.now() < avatarCache.expiresAt) {
    return avatarCache.items;
  }

  const existing = (await db.query('SELECT persona_key, image_data FROM avatar_assets')).rows;
  const byKey = new Map(existing.map((row) => [row.persona_key, row.image_data]));

  const items = [];
  for (const persona of EAGLE_TEAM) {
    let imageData = byKey.get(persona.key);
    if (!imageData || forceRefresh) {
      imageData = (await generateImageFromProvider(persona.prompt)) || makeSvgDataUri(persona.name, persona.accent);
      await upsertAvatarAsset(persona, imageData);
    }
    items.push({
      key: persona.key,
      name: persona.name,
      role: persona.role,
      region: persona.region,
      useCase: persona.use_case,
      prompt: persona.prompt,
      imageData,
    });
  }

  avatarCache.items = items;
  avatarCache.expiresAt = Date.now() + AVATAR_CACHE_MS;
  return items;
}

router.get('/team', async (_req, res) => {
  try {
    const items = await ensureAvatarAssets(false);
    res.set('Cache-Control', 'public, max-age=120');
    res.json({ items, generatedWithProvider: Boolean(GEMINI_KEY) });
  } catch (err) {
    console.error('[AVATARS] Team fetch error:', err.message);
    res.status(500).json({ error: 'Gabim gjate marrjes se avatarave' });
  }
});

router.post('/refresh', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const items = await ensureAvatarAssets(true);
    res.json({ ok: true, count: items.length, generatedWithProvider: Boolean(GEMINI_KEY) });
  } catch (err) {
    console.error('[AVATARS] Refresh error:', err.message);
    res.status(500).json({ error: 'Gabim gjate rifreskimit te avatarave' });
  }
});

module.exports = router;

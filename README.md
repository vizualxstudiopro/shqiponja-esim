# Shqiponja eSIM

Platformë e-commerce për shitjen e paketave eSIM ndërkombëtare. Ndërtuar me Next.js dhe Express.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Express 5, better-sqlite3, JWT, bcryptjs
- **Pagesa:** Stripe Checkout + Webhooks
- **Email:** Nodemailer (dev: console log)

## Struktura

```
frontend/       Next.js app (port 3000)
backend/        Express API (port 3001)
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # Edito vlerat sipas nevojës
```

Krijo `.env`:

```env
PORT=3001
JWT_SECRET=your-secret-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@shqiponja.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@shqiponja-esim.com
```

```bash
npm start     # produksion
npm run dev   # zhvillim (me nodemon)
```

Admin i parazgjedhur: `admin@shqiponja-esim.com` — NDRYSHO FJALËKALIMIN NË PRODUKSION!

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Opsionale, default: http://localhost:3001
npm run dev
```

### 3. Docker (Opsionale)

```bash
docker compose up -d
```

## CORS

Backend lejon kërkesa vetëm nga `FRONTEND_URL` (default `http://localhost:3000`). Për produksion, ndrysho `FRONTEND_URL` në `.env` me URL-në e vërtetë të frontend-it.

## Security

- Helmet security headers (CSP, X-Frame-Options, etj.)
- CORS i kufizuar me origin
- JWT me kontroll prodhimi (nuk lejon fallback secret)
- Rate limiting në auth dhe API endpoints
- HTML escaping në email templates (anti-XSS)
- Validim inputi me sanitizim
- Order access control (pronësia ose admin)
- Admin order status whitelist validation

## Features

- Katalog paketash eSIM me kërkim & filtrim
- Blerje me Stripe Checkout
- Gjenerim QR Code pas pagesës
- Regjistrim / Kyçje me JWT
- Verifikim email-i
- Rivendosje fjalëkalimi
- Panel admin (statistika, grafikë, menaxhim)
- Eksport CSV i porosive
- Kërkim në tabelat admin
- Profil përdoruesi me editim emri & fjalëkalimi
- Dark mode (pa flash/FOUC)
- i18n (Shqip / English)
- Faqe kontakti, Kushte Përdorimi, Privatësi
- Rate limiting & validim inputi
- Responsive dizajn mobile
- SEO (sitemap, robots.txt, Open Graph, meta per faqe)
- Error boundary & loading states
- Health check endpoint (`/api/health`)
- Request logging (morgan)
- Docker-ready me docker-compose
- JSON-LD structured data
- Accessibility (ARIA attributes, autoComplete, focus states)

## Environment Variables

### Backend (`backend/.env`)

| Variable | Përshkrim | Default |
|---|---|---|
| `PORT` | Port i serverit | `3001` |
| `JWT_SECRET` | Secret për JWT tokens | *(kërkohet në produksion)* |
| `STRIPE_SECRET_KEY` | Stripe API key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | — |
| `FRONTEND_URL` | URL e frontend | `http://localhost:3000` |
| `ADMIN_EMAIL` | Email i admin | `admin@shqiponja-esim.com` |
| `ADMIN_DEFAULT_PASSWORD` | Fjalëkalimi fillestar i admin | `admin123` |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | Email dërgues | — |
| `NODE_ENV` | Ambienti (`production`/`development`) | `development` |

### Frontend (`frontend/.env.local`)

| Variable | Përshkrim | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL e backend API | `http://localhost:3001` |

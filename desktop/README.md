# Shqiponja eSIM — Desktop Dashboard

Windows desktop admin dashboard built with **Electron + React + Vite + Tailwind CSS**.

Connects to the existing backend API at `shqiponja-esim-production.up.railway.app`.

## Features

- **Dashboard** — KPI cards (orders, revenue, users) + revenue chart (Recharts)
- **Orders** — Full table with search, detail modal, mark completed, resend eSIM
- **Customers** — Customer list with order count, total spent, detail modal
- **Packages** — All eSIM packages with visibility/highlight status
- **Webhook Log** — Paginated logs, status filter, full payload viewer
- **Settings** — Config overview cards (masked API keys)
- **Auth** — Admin-only login with 2FA support

## Setup

```bash
cd desktop
npm install
```

## Development

```bash
npm run dev
```

Opens Electron window pointed at Vite dev server (localhost:5173).

## Build for Windows

```bash
npm run build
```

Produces installer in `release/` folder via electron-builder.

## Structure

```
desktop/
  electron/       # Electron main process
    main.cjs
    preload.cjs
  src/
    main.tsx       # React entry
    App.tsx        # Router + protected routes
    lib/           # API client, auth context
    components/    # Sidebar, Layout, KpiCard, StatusBadge
    pages/         # Login, Dashboard, Orders, Customers, Packages, WebhookLogs, Settings
```

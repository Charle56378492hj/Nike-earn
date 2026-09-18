[README.md](https://github.com/user-attachments/files/31997039/README.md)
# Gaming Rewards Platform — Railway Deployment Guide

## Steps to Deploy on Railway

### Step 1 — Upload this folder to Railway
Upload the entire `ALL GAME` folder as your Railway project.

### Step 2 — Set Environment Variables in Railway
Go to your service → **Variables** tab and set:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.XXXX:YOUR_PASSWORD@aws-XX.pooler.supabase.com:6543/postgres` |
| `SESSION_SECRET` | Any long random string (min 32 characters) |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `ADMIN_EMAIL` | The email that becomes super admin on first register (optional) |

> **Note:** Railway sets `PORT` automatically — do NOT add it manually.

### Step 3 — Deploy
Railway will automatically:
1. Install dependencies (`npm install`)
2. Run database migrations (`npm run db:push:force`) — creates all tables
3. Build frontend + backend (`npm run build`)
4. Start the server

### First Admin Account
Set `ADMIN_EMAIL=your@email.com` **before** registering. When you register with that email, you automatically get super_admin role.

---

## Project Structure
```
├── server/          Express backend (TypeScript)
│   ├── app.ts       Express app setup
│   ├── index.ts     Server entry point
│   ├── db/          Drizzle ORM + PostgreSQL schema
│   ├── routes/      All API routes
│   ├── lib/         Auth, email, logger
│   └── zod/         Validation schemas
├── src/             React frontend (Vite + Tailwind)
├── index.html       Entry HTML
├── vite.config.ts   Vite config
├── railway.toml     Railway deploy config
└── nixpacks.toml    Build config
```

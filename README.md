# Crystal Clear CRM

A simple, lightweight CRM for **Crystal Clear Atherton** — client management and job/quote scheduling, built to run locally with your data stored in a SQLite file that survives restarts.

- 👥 **Clients** — searchable list, add clients (name, phone, email, property address, notes), delete.
- 🗓️ **Schedule** — create quotes & jobs linked to a client, grouped by day. Status (Quote → Scheduled → Completed / Cancelled), date & time, and price. Change a status inline.
- 🗺️ **Canvassing** — a door-to-door sales map. Log each door you knock with its outcome (Not home, Come back, Not interested, Interested, Quote booked, Sold, Do not knock) and the time. Pins are color-coded and filterable, can link to a client, and you can drop them by tapping the map or using your phone's GPS.
- 📊 **Dashboard** — client count, open quotes, scheduled jobs, pipeline value, and what's coming up.
- 🔐 **Logins & roles** — everyone signs in with their own email + password. **Owners** manage the team and see everything; **employees** use the CRM but can't manage accounts.
- 📱 Clean, responsive UI (Tailwind CSS) — works on desktop and mobile.

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS |
| Maps | Leaflet + OpenStreetMap (no API key needed) |
| Auth | Email + password, signed-cookie sessions (bcrypt + JWT) |

Front-end and API live in one app, so there's a single dev server to run.

## Prerequisites

- **Node.js 18.18+** (Node 20 or 22 recommended) and npm. Check with `node --version`.

## Getting started

From the project folder (`crystal-clear-crm`):

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create the local database (creates prisma/dev.db)
npm run db:push

# 3. Create your owner login + load sample Atherton data
npm run db:seed

# 4. Start the app
npm run dev
```

Then open **http://localhost:3000** and sign in with the starter owner account:

> **Email:** `jackjjpreston@gmail.com`  ·  **Password:** `changeme123`

**Change that password right away** from the **Team** page — then add an account there for each of your employees.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build (after `npm run build`) |
| `npm run db:push` | Create/update the SQLite schema from `prisma/schema.prisma` |
| `npm run db:seed` | Create the owner login + (re)load sample clients/jobs/knocks. **Your team's user accounts are never touched.** |
| `npm run create-owner` | Create/ensure an owner account with no sample data (for production). e.g. `OWNER_EMAIL=you@biz.com OWNER_PASSWORD=secret npm run create-owner` |
| `npm run db:studio` | Open Prisma Studio to browse/edit the database in your browser |

## Where is my data?

Everything lives in a single file: **`prisma/dev.db`**. It persists across restarts. To back up your data, copy that file. To start completely fresh, delete it and run `npm run db:push` again.

## Project structure

```
app/
  (app)/                  Signed-in app: Dashboard, Clients, Schedule, Canvassing, Team
  login/                  Login page
  api/clients, api/jobs   Data API routes (create, list, update, delete)
  api/knocks              Canvassing knock API
  api/geocode             Reverse-geocode proxy (OpenStreetMap Nominatim)
  api/auth                Login / logout
  api/users               Team management (owner only)
  layout.tsx              Root layout
middleware.ts             Locks every page & API behind a login
components/               Sidebar, Modal, forms, lists, map, login & team UI
lib/
  db.ts                   Prisma client
  auth.ts                 Password hashing + current-user helpers
  session.ts              Signed-cookie sessions (edge-safe)
  utils.ts                Status constants, formatters, shared types
prisma/
  schema.prisma           Client + Job + Knock + User models
  seed.ts                 Sample data + owner login
  create-owner.ts         Make an owner account (production setup)
```

### Using the canvassing map

Open **Canvassing** in the nav. Tap anywhere on the map to log a door (or press
**Use my location** on a phone to drop a pin at where you're standing). Pick the
outcome, and the address is auto-filled from the map. Each pin is color-coded;
click a pin to edit or delete it, and use the colored chips above the map to filter
by outcome (e.g. show only "Come back" doors you need to revisit). Map data is from
OpenStreetMap, so no API key or billing is required.

## Logging in & your team

Every page sits behind a login. There are two roles:

- **Owner** (you) — full access, plus a **Team** page to add/remove people and reset passwords.
- **Employee** — can use Clients, Schedule, and Canvassing, but can't manage accounts.

To add your 4 employees: sign in, open **Team → Add team member**, and set a name, email, and password for each. Hand them that email + password — that's their login. Forgot a password? **Team → edit that person → set a new one.** No email server required.

## Putting it online for your team

Right now the app runs on **one computer**. For you and your employees to log in from your own phones/laptops, it has to be hosted online with a shared database so everyone sees the same clients, jobs, and knocks. Two common paths:

**Easiest — Railway or Render (keeps SQLite):**
1. Push this folder to a GitHub repo.
2. Create a project on [Railway](https://railway.app) or [Render](https://render.com) from that repo.
3. Add a **persistent disk/volume** and point `DATABASE_URL` at a file on it (e.g. `file:/data/dev.db`).
4. Set a strong **`AUTH_SECRET`** (generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
5. On first deploy run `npm run db:push`, then `OWNER_EMAIL=... OWNER_PASSWORD=... npm run create-owner`.
6. Share the URL with your crew — they log in from anywhere. Roughly **$5/mo**.

**Alternative — Vercel + free Postgres (Neon/Supabase):**
Vercel can't keep a SQLite file, so switch the database to Postgres: in `prisma/schema.prisma` change `provider = "sqlite"` → `provider = "postgresql"`, set `DATABASE_URL` to your Neon/Supabase connection string and `AUTH_SECRET`, then run `npm run db:push` + `npm run create-owner`. The app code doesn't change.

Either way: use a **strong `AUTH_SECRET`** and change the starter password immediately. (Happy to walk you through the deploy when you're ready.)

## Notes & next ideas

- **Status values** are stored as text (`QUOTE`, `SCHEDULED`, `COMPLETED`, `CANCELLED`) so they're easy to extend.
- Deleting a client also removes their jobs/quotes (cascade).
- Natural next steps: tagging each job/knock with the employee who logged it, editing clients/jobs in place, a month calendar view, and invoices/PDF export.

## Security

- Passwords are hashed with **bcrypt**; sessions are **signed, HTTP-only cookies**. Keep `AUTH_SECRET` private and use a strong, unique value in production.
- Always serve the app over **HTTPS** in production (Railway/Render/Vercel do this for you) so logins are encrypted in transit.
- Next.js is pinned to **14.2.35** (security-patched). `npm audit` may still list Next advisories — they're aggregated and mostly cover features this app doesn't use (image optimizer, i18n, RSC caching). Stay on the latest **14.2.x** patch; jumping to Next 15/16 needs code changes (async route params, React 19).

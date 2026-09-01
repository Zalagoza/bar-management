# Bar Manager

A bar management system for tracking sales, stock, bills, orders, operating
costs, salaries/wages, assets, loans, capital, and a full Profit & Loss
statement — built on Next.js (App Router) + TypeScript + PostgreSQL + Prisma.

## How the books work (read this first)

Every money-moving action in the app — a sale, a stock purchase, an expense,
a salary payment, a loan, a capital injection — automatically writes a
**balanced double-entry journal entry** behind the scenes (see
`src/lib/journal.ts` and `src/lib/accounts.ts`). Nothing about a past
transaction can be edited or deleted through the app:

- **Bartenders** can only *create* new Sales and Stock Receipts. There are no
  update/delete actions for these anywhere in the codebase.
- **Admins** can record bills, operating costs, salaries, assets, loans, and
  capital, and can log payments against bills/loans — but a payment is always
  a *new* record, never an edit to the original amount.
- Stock levels are **derived** (received − sold) from immutable records, not
  stored as an editable number.
- The Profit & Loss statement (`/admin/reports/pnl`) is computed live from
  the journal — it cannot drift out of sync with the underlying records
  because there's nothing else to keep in sync.
- The full journal is visible at `/admin/journal` — this is the "book of
  records."

If a mistake is made, the correct accounting practice is a **reversing
entry**, not editing history — extend the relevant server action in
`src/lib/actions/` if you need this workflow.

## Stack

- **Next.js 16** (App Router, Server Actions) + **TypeScript**
- **PostgreSQL** via **Prisma ORM**
- **NextAuth v5** (credentials login, JWT sessions, role-based middleware)
- **Tailwind CSS**

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Get a PostgreSQL database.** Any of these work well and have a free tier:
   - [Neon](https://neon.tech)
   - [Supabase](https://supabase.com)
   - [Railway](https://railway.app)
   - Or a local Postgres install / Docker container.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `DATABASE_URL` — your Postgres connection string.
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev.

4. **Create the database schema**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed the chart of accounts, default users, and starter products**
   ```bash
   npm run seed
   ```
   This prints a default admin and bartender login — **change both
   passwords immediately** (add a "change password" flow, or update the
   `passwordHash` directly via `npx prisma studio`, before giving this to
   real staff).

6. **Run the app**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` — you'll be redirected to `/login`.

## Deploying (for remote/online access)

1. Push this project to a GitHub repository.
2. Create a **PostgreSQL database** (Neon/Supabase/Railway all integrate
   directly with Vercel).
3. Import the repo into [Vercel](https://vercel.com/new).
4. Set the same environment variables from `.env` in the Vercel project
   settings (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` — set this to your
   production URL, e.g. `https://your-bar.vercel.app`).
5. Before or after the first deploy, run the migration and seed against the
   **production** database:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
   (Run these locally with `DATABASE_URL` temporarily pointed at production,
   or via the hosting provider's shell/console.)
6. Deploy. Admins and bartenders can now log in from any device with the
   production URL.

## Project structure

```
prisma/schema.prisma        All data models + the double-entry Account/JournalEntry/JournalLine tables
prisma/seed.ts               Chart of accounts + default users + starter products
src/lib/accounts.ts          Fixed chart of accounts (don't rename codes once you have real data)
src/lib/journal.ts           postJournal() — the only way entries get written; enforces debits == credits
src/lib/auth.ts              NextAuth config (credentials login)
src/lib/guards.ts            requireUser() / requireAdmin() — server-side role checks
src/lib/actions/*.ts         Server Actions — one file per module (sales, stock, bills, orders, ...)
src/lib/reports/pnl.ts       Profit & Loss, computed from the journal
src/lib/reports/stock.ts     Stock on hand, derived from receipts minus sales
src/middleware.ts            Route protection: /admin requires ADMIN, /bartender requires login
src/app/login                Login page
src/app/bartender/*          Bartender dashboard, new sale, new stock
src/app/admin/*               Admin dashboard + every module's report/entry page
```

## Extending it

- **New expense categories / accounts**: add to `src/lib/accounts.ts`, then
  re-run `npm run seed` (it's idempotent — safe to re-run).
- **More users**: currently seeded manually; add an admin-only "create user"
  page using the same pattern as `src/lib/actions/salaries.ts`.
- **Multi-bar / multi-branch**: add a `Branch` model and a `branchId` foreign
  key across the transactional tables, then filter by branch in each query.
- **Receipts/printing**: hook a PDF library into the sale confirmation flow.

## Default seeded logins

| Role      | Email                | Password (change immediately) |
|-----------|-----------------------|--------------------------------|
| Admin     | admin@bar.local       | Admin@12345                    |
| Bartender | bartender@bar.local   | Barkeep@12345                  |

Override these before seeding by setting `SEED_ADMIN_PASSWORD` and
`SEED_BARTENDER_PASSWORD` environment variables.

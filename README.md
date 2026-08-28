# 🍊 OrangePOS — Restaurant Workflow

A restaurant workflow web app: waiters take orders per table, confirmed orders print a kitchen slip, the cashier sees table bills and completes checkout to free the table, and the owner/admin manages tables, users, and the menu.

## Roles & workflow

1. **Waiter** — sees the table map, opens a free table, adds menu items, and **confirms** the order → a kitchen slip (ticket) is created. When guests want to pay, the waiter sends the table to **checkout**.
2. **Kitchen** — sees incoming slips in real time; slips can auto-print (browser print) or print on demand; marks slips done when cooked.
3. **Cashier** — sees all open tables with items & totals; checkout requests are highlighted. "Mark paid" completes the order, shows a printable receipt, and frees the table.
4. **Admin (owner)** — manages tables, menu items, and users; also has access to all role screens.

## Getting started

```bash
# start a local Postgres (or point DATABASE_URL at any Postgres)
docker run -d --name pg -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=restaurant -p 5432:5432 postgres:16-alpine

cp .env.example .env         # adjust DATABASE_URL if needed
npm install
npx prisma migrate dev       # create the database schema
npm run db:seed              # seed demo users, tables and menu
npm run dev
```

Open http://localhost:3000 and log in with one of the demo accounts (password `password123`):

| Username | Role    |
| -------- | ------- |
| admin    | Admin   |
| waiter   | Waiter  |
| kitchen  | Kitchen |
| cashier  | Cashier |

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (orange theme)
- Prisma + PostgreSQL
- JWT cookie auth (set `JWT_SECRET` in production)

## Deploying to Vercel

1. Create a Postgres database — easiest is **Neon** from the Vercel Marketplace (Storage → Create Database → Neon, free tier). This sets `DATABASE_URL` on the project automatically.
2. Import this repo into Vercel. The build script runs `prisma migrate deploy`, so the schema is created on first deploy.
3. Add a `JWT_SECRET` environment variable (any long random string).
4. Seed demo data once from your machine:
   ```bash
   DATABASE_URL="<your neon connection string>" npm run db:seed
   ```

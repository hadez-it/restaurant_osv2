# 🍊 OrangePOS — Restaurant Workflow

A restaurant workflow web app: waiters take orders per table, confirmed orders print a kitchen slip, the cashier sees table bills and completes checkout to free the table, and the owner/admin manages tables, users, and the menu.

## Roles & workflow

1. **Waiter** — sees the table map, opens a free table, adds menu items, and **confirms** the order → a kitchen slip (ticket) is created. When guests want to pay, the waiter sends the table to **checkout**.
2. **Kitchen** — sees incoming slips in real time; slips can auto-print (browser print) or print on demand; marks slips done when cooked.
3. **Cashier** — sees all open tables with items & totals; checkout requests are highlighted. "Mark paid" completes the order, shows a printable receipt, and frees the table.
4. **Admin (owner)** — manages tables, menu items, and users; also has access to all role screens.

## Getting started

```bash
npm install
npx prisma migrate dev   # creates the SQLite database
npx tsx prisma/seed.ts   # seed demo users, tables and menu
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
- Prisma + SQLite
- JWT cookie auth (set `JWT_SECRET` in production)

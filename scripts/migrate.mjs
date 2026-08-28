// Run prisma migrate deploy, falling back to Neon/Vercel Postgres env vars
// when DATABASE_URL is not set.
import { spawnSync } from "node:child_process";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error("No database URL found (DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL).");
  process.exit(1);
}

const res = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(res.status ?? 1);

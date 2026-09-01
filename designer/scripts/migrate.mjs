/**
 * Applies pending migrations during a deploy, without making the build depend
 * on reaching the database.
 *
 * A build container cannot always talk to production Postgres — the URL may be
 * a build-time secret, the host may allowlist IPs, a preview deploy may have no
 * database at all. Failing the build in those cases ships nothing and says
 * little. So a migration problem here is reported loudly and the build carries
 * on; the running app reports a missing schema by name (see src/lib/api.ts).
 *
 * Set MIGRATE_STRICT=1 to fail the build instead.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const STRICT = process.env.MIGRATE_STRICT === "1";

/**
 * The Prisma CLI reads .env but Node does not, so without this the script would
 * see no connection string locally and skip migrations that would have worked.
 * Real environment variables always win, as they do for Prisma.
 */
function loadDotEnv(file) {
  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    const value = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
    process.env[key] = value;
  }
}

loadDotEnv(".env.local");
loadDotEnv(".env");

/**
 * Migrations take a Postgres advisory lock, which transaction-mode poolers
 * (pgbouncer, Supabase :6543) do not support, so prefer a direct URL when the
 * host provides one. These are the names Neon, Supabase and Vercel use.
 */
const URL_VARS = [
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
];

const chosen = URL_VARS.find((name) => process.env[name]);

function warn(lines) {
  const width = Math.max(...lines.map((l) => l.length));
  console.warn(`\n${"─".repeat(width)}`);
  lines.forEach((l) => console.warn(l));
  console.warn(`${"─".repeat(width)}\n`);
}

if (!chosen) {
  warn([
    "Skipping database migrations: no connection string in the environment.",
    `Looked for: ${URL_VARS.join(", ")}.`,
    "The build will finish, but the app cannot read or write until DATABASE_URL",
    "is set and `npx prisma migrate deploy` has run.",
  ]);
  process.exit(0);
}

const url = process.env[chosen];
const pooled = /pgbouncer=true|:6543|-pooler\./.test(url);

if (pooled && chosen === "DATABASE_URL") {
  warn([
    "DATABASE_URL looks like a pooled connection, and migrations need a direct one.",
    "If this fails, set DIRECT_URL to your database's direct connection string",
    "(Neon: the unpooled URL; Supabase: port 5432 rather than 6543).",
  ]);
}

console.log(`Applying migrations using ${chosen}…`);

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } }
);

if (result.status === 0) process.exit(0);

warn([
  "Database migrations did not run.",
  "",
  "The deploy will continue, but every read and write will fail until the",
  "schema is applied. The app will say so rather than erroring generically.",
  "",
  "Common causes:",
  "  P1001 / P1002  the build cannot reach the database — apply migrations",
  "                 yourself with `npx prisma migrate deploy` against the",
  "                 production DATABASE_URL, or allow the build host's IP.",
  "  advisory lock  the URL is a transaction-mode pooler — set DIRECT_URL.",
  "  P3005          the database already has tables from `prisma db push` —",
  "                 adopt it with `npx prisma migrate resolve --applied <name>`.",
  "",
  "Set MIGRATE_STRICT=1 to fail the build on this instead.",
]);

process.exit(STRICT ? 1 : 0);

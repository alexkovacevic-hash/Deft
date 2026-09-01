/**
 * Checks a database connection string and says what's wrong in plain terms.
 *
 * Run before setting DATABASE_URL on a host, so a bad value is caught here
 * rather than by a failed deploy:
 *
 *   npm run db:check                        # checks .env
 *   DATABASE_URL="postgres://…" npm run db:check
 */
import { readFileSync } from "node:fs";

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
    process.env[key] = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
  }
}
loadDotEnv(".env.local");
loadDotEnv(".env");

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("\n✗ DATABASE_URL is not set.\n");
  console.error("  Pass one in:  DATABASE_URL=\"postgresql://…\" npm run db:check");
  console.error("  or put it in .env — see .env.example.\n");
  process.exit(1);
}

// Report the shape without ever printing the password.
let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error("\n✗ DATABASE_URL is not a valid URL.\n");
  console.error("  Expected: postgresql://USER:PASSWORD@HOST:PORT/DATABASE\n");
  process.exit(1);
}

if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
  console.error(`\n✗ DATABASE_URL starts with "${parsed.protocol}//" — it must be postgresql://\n`);
  process.exit(1);
}
if (!parsed.hostname) {
  console.error("\n✗ DATABASE_URL has no host.\n");
  process.exit(1);
}
if (!parsed.pathname.replace(/^\//, "")) {
  console.error("\n✗ DATABASE_URL has no database name after the host.\n");
  console.error("  Expected: postgresql://USER:PASSWORD@HOST:PORT/DATABASE\n");
  process.exit(1);
}
if (parsed.password && /[@/:?#]/.test(decodeURIComponent(parsed.password)) &&
    parsed.password === decodeURIComponent(parsed.password)) {
  console.warn("\n! The password contains a character that must be percent-encoded (@ / : ? #).");
  console.warn("  Encode it, e.g. @ becomes %40, or the string will be parsed wrongly.\n");
}

const pooled = /pgbouncer=true|:6543|-pooler\./.test(url);
console.log(`\nHost:     ${parsed.hostname}:${parsed.port || "5432"}`);
console.log(`Database: ${parsed.pathname.replace(/^\//, "")}`);
console.log(`User:     ${parsed.username || "(none)"}`);
console.log(`Looks:    ${pooled ? "pooled — right for DATABASE_URL on serverless" : "direct — right for DIRECT_URL"}`);
console.log("\nConnecting…");

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  await prisma.$queryRaw`SELECT 1`;
  const tables = await prisma.$queryRaw`
    SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`;
  const count = tables[0]?.n ?? 0;

  console.log("\n✓ Connected.");
  if (count === 0) {
    console.log("  The database is empty. Run `npx prisma migrate deploy` to create the tables.\n");
  } else {
    console.log(`  ${count} tables present — the schema is applied.\n`);
  }
} catch (error) {
  const message = String(error.message);
  console.error("\n✗ Could not connect.\n");

  if (message.includes("Can't reach database server")) {
    console.error("  The host did not answer. Check the host and port are right, that the");
    console.error("  database is running, and that it accepts connections from here.");
    console.error("  Supabase's direct host is IPv6-only — use the pooled string instead.");
  } else if (message.includes("Authentication failed")) {
    console.error("  The username or password was rejected. Percent-encode any of @ / : ? #");
    console.error("  in the password.");
  } else if (message.includes("does not exist")) {
    console.error("  That database name does not exist on the server.");
  } else {
    console.error(`  ${message.split("\n").filter(Boolean).slice(0, 3).join("\n  ")}`);
  }
  console.error("");
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

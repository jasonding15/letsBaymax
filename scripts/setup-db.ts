/**
 * Applies db/schema.sql to the database in DATABASE_URL.
 * Run with: npm run db:setup
 *
 * Loads .env.local / .env if present (no extra deps; tiny parser below).
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The pooled (pg-compatible) client uses WebSockets. Node 22+ ships a global
// WebSocket, so wire it up for environments that need it.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

function loadEnvFile(file: string) {
  try {
    const content = readFileSync(join(process.cwd(), file), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // file doesn't exist — fine
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
    process.exit(1);
  }

  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");

  console.log("Applying db/schema.sql ...");
  // Postgres' simple query protocol runs all the semicolon-separated statements
  // in one call, so the whole schema (incl. comments) applies in a single query.
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(schema);
  } finally {
    await pool.end();
  }

  console.log("Done. Schema applied.");
}

main().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});

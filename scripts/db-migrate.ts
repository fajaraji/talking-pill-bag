import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Tiny .env.local parser (no new dependency)
function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip optional quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL) {
  loadEnvLocal();
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Provide it via environment or .env.local.");
  process.exit(1);
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(databaseUrl!);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.resolve(__dirname, "../db/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Remove line comments, then split into statements
  const cleaned = schema
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const sqlText = stmt + ";";
    await sql.query(sqlText);
    console.log("Executed:", sqlText.split("\n")[0].trim());
  }

  console.log("Migration completed.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

/**
 * Apply db/schema.sql to the configured DATABASE_URL.
 *
 *   npm run db:migrate
 */
import fs from "fs";
import { Pool } from "@neondatabase/serverless";
import { loadEnvLocal, requireEnv } from "./env";

async function main() {
  loadEnvLocal();
  const pool = new Pool({ connectionString: requireEnv("DATABASE_URL") });
  const schema = fs.readFileSync("db/schema.sql", "utf8");

  try {
    await pool.query(schema);
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM jobs");
    console.log(`Done — jobs table ready (${count.rows[0].count} rows).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

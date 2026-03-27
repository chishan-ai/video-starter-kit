import postgres from "postgres";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
const dbUrl = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.split("=")
  .slice(1)
  .join("=")
  .replace(/^["']|["']$/g, "");
if (!dbUrl) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const sql = postgres(dbUrl);

async function migrate() {
  await sql`ALTER TABLE shots ADD COLUMN IF NOT EXISTS voiceover_text TEXT`;
  await sql`ALTER TABLE shots ADD COLUMN IF NOT EXISTS tts_audio_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`;
  console.log("Migration complete: 4 columns added");
  await sql.end();
}

migrate().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

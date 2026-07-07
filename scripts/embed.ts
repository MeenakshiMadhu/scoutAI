/**
 * Offline job embedding — run after changing jobs.json or switching embedding models.
 *
 *   npm run embed:jobs
 *
 * Requires OPENAI_API_KEY and DATABASE_URL in .env.local (or environment).
 * Upserts embedded jobs into PostgreSQL (pgvector).
 */
import fs from "fs";
import OpenAI from "openai";
import { jobEmbedText, EMBEDDING_MODEL } from "../src/lib/embedConfig";
import { loadEnvLocal, requireEnv } from "./env";

const BATCH_SIZE = 100;
const JOBS_PATH = "src/data/jobs.json";

type Job = {
  id: string;
  title: string;
  company: string;
  role_family: string;
  seniority: string;
  seniority_rank: number;
  min_years: number;
  location: string;
  country: string;
  location_type: string;
  department: string;
  employment_type: string;
  date_posted: string;
  compensation: string;
  compensation_min: number;
  compensation_max: number;
  skills: string[];
  description: string;
};

async function embedBatch(
  client: OpenAI,
  texts: string[]
): Promise<number[][]> {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);
}

async function main() {
  loadEnvLocal();
  requireEnv("DATABASE_URL");
  const apiKey = requireEnv("OPENAI_API_KEY");

  const { upsertJob, countJobs } = await import("../src/lib/jobsDb");
  const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf8")) as Job[];
  const client = new OpenAI({ apiKey });

  console.log(`Embedding ${jobs.length} jobs with ${EMBEDDING_MODEL}...`);

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const texts = batch.map((j) => jobEmbedText(j));
    const vectors = await embedBatch(client, texts);

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      await upsertJob({
        ...row,
        date_posted: String(row.date_posted).slice(0, 10),
        embedding: vectors[j],
        embedding_model: EMBEDDING_MODEL,
      });
    }

    console.log(`  ${Math.min(i + BATCH_SIZE, jobs.length)}/${jobs.length}`);
  }

  const total = await countJobs();
  console.log(`Done — ${total} jobs upserted into PostgreSQL.`);
  console.log(`Vector dim: ${jobs.length ? 1536 : 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

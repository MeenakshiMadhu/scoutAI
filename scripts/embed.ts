/**
 * Offline job embedding — run after changing jobs.json or switching embedding models.
 *
 *   npm run embed:jobs
 *
 * Requires OPENAI_API_KEY in .env.local (or environment).
 * Writes src/data/jobs-embedded.json
 */
import fs from "fs";
import OpenAI from "openai";
import { EMBEDDING_MODEL, jobEmbedText } from "../src/lib/embedConfig";

const BATCH_SIZE = 100;
const JOBS_PATH = "src/data/jobs.json";
const OUT_PATH = "src/data/jobs-embedded.json";

type Job = {
  id: string;
  title: string;
  role_family: string;
  seniority: string;
  skills: string[];
  description: string;
  [key: string]: unknown;
};

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local optional if key already in environment
  }
}

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY. Set it in .env.local or the environment.");
    process.exit(1);
  }

  const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf8")) as Job[];
  const client = new OpenAI({ apiKey });
  const out: (Job & { embedding: number[]; embedding_model: string })[] = [];

  console.log(`Embedding ${jobs.length} jobs with ${EMBEDDING_MODEL}...`);

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const texts = batch.map((j) => jobEmbedText(j));
    const vectors = await embedBatch(client, texts);

    for (let j = 0; j < batch.length; j++) {
      out.push({
        ...batch[j],
        embedding_model: EMBEDDING_MODEL,
        embedding: vectors[j],
      });
    }

    console.log(`  ${Math.min(i + BATCH_SIZE, jobs.length)}/${jobs.length}`);
  }

  fs.mkdirSync("src/data", { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`Done — wrote ${out.length} jobs to ${OUT_PATH}`);
  console.log(`Vector dim: ${out[0]?.embedding.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * One-time import from src/data/jobs-embedded.json into PostgreSQL.
 * Use after db:migrate if you already have embedded jobs locally.
 *
 *   npm run db:seed
 */
import fs from "fs";
import { loadEnvLocal, requireEnv } from "./env";

// Ensure DATABASE_URL is set before importing jobsDb
loadEnvLocal();
requireEnv("DATABASE_URL");

const EMBEDDED_PATH = "src/data/jobs-embedded.json";

async function main() {
  if (!fs.existsSync(EMBEDDED_PATH)) {
    console.error(
      `Missing ${EMBEDDED_PATH}. Run npm run embed:jobs first, or embed from jobs.json.`
    );
    process.exit(1);
  }

  const { upsertJob, countJobs } = await import("../src/lib/jobsDb");
  const jobs = JSON.parse(fs.readFileSync(EMBEDDED_PATH, "utf8")) as Array<
    Record<string, unknown> & { id: string; embedding: number[] }
  >;

  console.log(`Seeding ${jobs.length} jobs into PostgreSQL...`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    await upsertJob({
      id: job.id,
      title: job.title as string,
      company: job.company as string,
      role_family: job.role_family as string,
      seniority: job.seniority as string,
      seniority_rank: job.seniority_rank as number,
      min_years: job.min_years as number,
      location: job.location as string,
      country: job.country as string,
      location_type: job.location_type as string,
      department: job.department as string,
      employment_type: job.employment_type as string,
      date_posted: String(job.date_posted).slice(0, 10),
      compensation: job.compensation as string,
      compensation_min: job.compensation_min as number,
      compensation_max: job.compensation_max as number,
      skills: job.skills as string[],
      description: job.description as string,
      embedding: job.embedding,
      embedding_model: (job.embedding_model as string) ?? "text-embedding-3-small",
    });

    if ((i + 1) % 100 === 0 || i + 1 === jobs.length) {
      console.log(`  ${i + 1}/${jobs.length}`);
    }
  }

  const total = await countJobs();
  console.log(`Done — ${total} jobs in database.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

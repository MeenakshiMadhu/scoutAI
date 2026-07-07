import { getSql } from "@/lib/db";
import type { Job, JobWithEmbedding } from "@/lib/jobTypes";

type JobRow = {
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
  embedding?: string | number[];
  embedding_model?: string;
};

function parseEmbedding(raw: string | number[] | undefined): number[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as number[];
    } catch {
      return raw
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((n) => parseFloat(n.trim()));
    }
  }
  return undefined;
}

function rowToJob(row: JobRow): Job {
  const embedding = parseEmbedding(row.embedding);
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    role_family: row.role_family,
    seniority: row.seniority,
    seniority_rank: row.seniority_rank,
    min_years: row.min_years,
    location: row.location,
    country: row.country,
    location_type: row.location_type,
    department: row.department,
    employment_type: row.employment_type,
    date_posted:
      typeof row.date_posted === "string"
        ? row.date_posted.slice(0, 10)
        : String(row.date_posted),
    compensation: row.compensation,
    compensation_min: row.compensation_min,
    compensation_max: row.compensation_max,
    skills: row.skills,
    description: row.description,
    ...(embedding ? { embedding, embedding_model: row.embedding_model } : {}),
  };
}

export async function fetchJobsForBrowse(): Promise<Job[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id, title, company, role_family, seniority, seniority_rank, min_years,
      location, country, location_type, department, employment_type, date_posted,
      compensation, compensation_min, compensation_max, skills, description
    FROM jobs
    ORDER BY date_posted DESC
  `;
  return (rows as JobRow[]).map(rowToJob);
}

export async function fetchJobsForMatch(): Promise<JobWithEmbedding[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id, title, company, role_family, seniority, seniority_rank, min_years,
      location, country, location_type, department, employment_type, date_posted,
      compensation, compensation_min, compensation_max, skills, description,
      embedding::text AS embedding, embedding_model
    FROM jobs
  `;
  return (rows as JobRow[])
    .map(rowToJob)
    .filter((j): j is JobWithEmbedding => Array.isArray(j.embedding));
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id, title, company, role_family, seniority, seniority_rank, min_years,
      location, country, location_type, department, employment_type, date_posted,
      compensation, compensation_min, compensation_max, skills, description
    FROM jobs
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = (rows as JobRow[])[0];
  return row ? rowToJob(row) : null;
}

export async function countJobs(): Promise<number> {
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM jobs`;
  return (rows[0] as { count: number }).count;
}

export type JobUpsertInput = JobWithEmbedding & { embedding_model: string };

export async function upsertJob(job: JobUpsertInput): Promise<void> {
  const sql = getSql();
  const embeddingJson = JSON.stringify(job.embedding);

  await sql`
    INSERT INTO jobs (
      id, title, company, role_family, seniority, seniority_rank, min_years,
      location, country, location_type, department, employment_type, date_posted,
      compensation, compensation_min, compensation_max, skills, description,
      embedding, embedding_model
    ) VALUES (
      ${job.id},
      ${job.title},
      ${job.company},
      ${job.role_family},
      ${job.seniority},
      ${job.seniority_rank},
      ${job.min_years},
      ${job.location},
      ${job.country},
      ${job.location_type},
      ${job.department},
      ${job.employment_type},
      ${job.date_posted},
      ${job.compensation},
      ${job.compensation_min},
      ${job.compensation_max},
      ${job.skills},
      ${job.description},
      ${embeddingJson}::vector,
      ${job.embedding_model}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      role_family = EXCLUDED.role_family,
      seniority = EXCLUDED.seniority,
      seniority_rank = EXCLUDED.seniority_rank,
      min_years = EXCLUDED.min_years,
      location = EXCLUDED.location,
      country = EXCLUDED.country,
      location_type = EXCLUDED.location_type,
      department = EXCLUDED.department,
      employment_type = EXCLUDED.employment_type,
      date_posted = EXCLUDED.date_posted,
      compensation = EXCLUDED.compensation,
      compensation_min = EXCLUDED.compensation_min,
      compensation_max = EXCLUDED.compensation_max,
      skills = EXCLUDED.skills,
      description = EXCLUDED.description,
      embedding = EXCLUDED.embedding,
      embedding_model = EXCLUDED.embedding_model
  `;
}

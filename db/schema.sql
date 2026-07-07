-- scoutAI job store (PostgreSQL + pgvector)
-- Run: npm run db:migrate

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  role_family TEXT NOT NULL,
  seniority TEXT NOT NULL,
  seniority_rank INTEGER NOT NULL,
  min_years INTEGER NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  location_type TEXT NOT NULL,
  department TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  date_posted DATE NOT NULL,
  compensation TEXT NOT NULL,
  compensation_min INTEGER NOT NULL,
  compensation_max INTEGER NOT NULL,
  skills TEXT[] NOT NULL,
  description TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small'
);

CREATE INDEX IF NOT EXISTS idx_jobs_role_family ON jobs (role_family);
CREATE INDEX IF NOT EXISTS idx_jobs_seniority ON jobs (seniority);
CREATE INDEX IF NOT EXISTS idx_jobs_seniority_rank ON jobs (seniority_rank);
CREATE INDEX IF NOT EXISTS idx_jobs_date_posted ON jobs (date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location_type ON jobs (location_type);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs (employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location_lower ON jobs (lower(location));

-- ANN index for cosine similarity (used as dataset grows)
CREATE INDEX IF NOT EXISTS idx_jobs_embedding_hnsw
  ON jobs USING hnsw (embedding vector_cosine_ops);

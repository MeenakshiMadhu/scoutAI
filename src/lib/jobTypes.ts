export type Job = {
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
  embedding?: number[];
  embedding_model?: string;
};

export type JobWithEmbedding = Job & { embedding: number[] };

export type PublicJob = Omit<Job, "embedding" | "embedding_model">;

export function toPublicJob(job: Job): PublicJob {
  const { embedding: _e, embedding_model: _m, ...rest } = job;
  return rest;
}

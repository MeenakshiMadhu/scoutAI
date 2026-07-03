import jobs from "@/data/jobs.json";

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
};

export const JOBS = jobs as Job[];

// distinct values for populating filter dropdowns — computed once
export const FAMILIES = [...new Set(JOBS.map((j) => j.role_family))].sort();
export const LOCATION_TYPES = ["On-site", "Remote", "Hybrid"];
export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Intern"];

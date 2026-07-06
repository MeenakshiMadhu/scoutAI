/** Shared embedding config — job corpus text shape must match resume embed_text. */
export const EMBEDDING_MODEL = "text-embedding-3-small";

export type JobEmbedInput = {
  title: string;
  role_family: string;
  seniority: string;
  skills: string[];
  description: string;
};

export function jobEmbedText(job: JobEmbedInput): string {
  return (
    `${job.title}. Field: ${job.role_family}. Seniority: ${job.seniority}. ` +
    `Skills: ${job.skills.join(", ")}. ${job.description.slice(0, 600)}`
  );
}

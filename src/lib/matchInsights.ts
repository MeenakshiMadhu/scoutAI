import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

export type InsightProfile = {
  title?: string;
  role_family: string;
  seniority: string;
  skills: string[];
  years_experience?: number;
  summary?: string;
};

export type InsightJob = {
  title: string;
  company: string;
  role_family: string;
  seniority: string;
  skills: string[];
  min_years: number;
  description: string;
};

export type MatchInsightsResult = {
  insights: string[];
  matchingSkills: string[];
};

function insightsSchema() {
  return {
    type: "object" as const,
    properties: {
      insights: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Exactly 3 brief reasons, written directly to the candidate as you/your",
      },
      matchingSkills: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Skills from the job listing that clearly overlap the candidate profile",
      },
    },
    required: ["insights", "matchingSkills"] as const,
    additionalProperties: false,
  };
}

const SYSTEM_PROMPT = `You explain job–candidate fit for a career matching app. The app speaks directly to the candidate.

Rules:
- Write exactly 3 brief reasons (one short sentence each, max ~18 words).
- Always use second person: "you", "your" — never "the candidate", "they", or third person.
- Example: "Your 4 years of experience fit this role's mid-level expectations."
- Be specific when possible: seniority, years, role field, overlapping skills.
- Only claim skills or experience supported by the profile provided.
- matchingSkills: job skills that overlap the candidate's skills (max 6).
- Tone: direct, encouraging, concise — no filler or hype.`;

export async function generateMatchInsights(
  profile: InsightProfile,
  job: InsightJob
): Promise<MatchInsightsResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const desc = job.description.slice(0, 2000);

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Candidate profile:
- Title: ${profile.title ?? "Not specified"}
- Field: ${profile.role_family}
- Seniority: ${profile.seniority}
- Years: ${profile.years_experience ?? "Not specified"}
- Skills: ${profile.skills.join(", ") || "None listed"}
- Summary: ${profile.summary ?? "Not provided"}

Job:
- Title: ${job.title} at ${job.company}
- Field: ${job.role_family}
- Seniority: ${job.seniority}
- Min years: ${job.min_years}
- Required skills: ${job.skills.join(", ")}
- Description excerpt:
${desc}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "match_insights",
        strict: true,
        schema: insightsSchema(),
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");

  const parsed = JSON.parse(content) as MatchInsightsResult;
  return {
    insights: parsed.insights.slice(0, 3),
    matchingSkills: parsed.matchingSkills.slice(0, 6),
  };
}

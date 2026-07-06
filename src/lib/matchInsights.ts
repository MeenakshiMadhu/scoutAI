import OpenAI from "openai";
import { resumeSupportsSkill } from "@/lib/skillMatchVerify";

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

export type SkillKeyword = {
  term: string;
  matched: boolean;
};

export type MatchInsightsResult = {
  insights: string[];
  skillKeywords: SkillKeyword[];
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
      skillKeywords: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            term: {
              type: "string" as const,
              description: "Skill or keyword phrase found in the job posting",
            },
            matched: {
              type: "boolean" as const,
              description:
                "Best guess whether the candidate resume supports this JD term",
            },
          },
          required: ["term", "matched"] as const,
          additionalProperties: false,
        },
        description:
          "Skills and keywords extracted from the job listing and description only",
      },
    },
    required: ["insights", "skillKeywords"] as const,
    additionalProperties: false,
  };
}

const SYSTEM_PROMPT = `You analyze job–candidate fit for a career matching app. The app speaks directly to the candidate.

=== INSIGHTS (3 reasons) ===
- Write exactly 3 brief reasons (one short sentence each, max ~18 words).
- Always use second person: "you", "your" — never "the candidate", "they", or third person.
- Be specific: seniority, years, role field, overlapping skills when relevant.
- Only claim experience or skills supported by the candidate profile.
- Tone: direct, encouraging, concise.

=== SKILL KEYWORDS (extract from JOB only) ===
Build a comprehensive list of skills and keywords this role requires.

Step 1 — Listed required skills:
- Include EVERY entry from the structured "Listed required skills" array (fix casing only, e.g. "python" → "Python").

Step 2 — Job description (any format):
- Read the entire description: bullets, paragraphs, Requirements, Qualifications, Nice-to-have, etc.
- Extract tools, technologies, frameworks, platforms, languages, and domain phrases explicitly mentioned.
- EXPAND parenthetical and slash lists into separate terms:
  • "cloud infrastructure (aws, gcp, or azure)" → cloud infrastructure, AWS, GCP, Azure
  • "python, java, or go" → Python, Java, Go
  • "CI/CD" stays as CI/CD (do not split)
- Include multi-word phrases when they appear in the JD (e.g. "distributed systems", "API design", "cloud infrastructure", "query optimization").
- Do NOT invent technologies absent from the job listing or description.
- Do NOT add skills that appear only on the candidate resume.

Step 3 — Match flag (initial guess):
- Set matched=true when the candidate profile likely supports the term (skills list, summary, title, or common synonym like k8s/Kubernetes).
- Set matched=false when the JD requires it but the profile shows no evidence.

Output rules:
- Target 15–25 terms for detailed JDs; never omit a listed required skill.
- Skills and technologies only — no "2+ years" lines.
- No duplicates. Sort matched terms first.`;

function finalizeSkillKeywords(
  job: InsightJob,
  profile: InsightProfile,
  llmKeywords: SkillKeyword[]
): SkillKeyword[] {
  const byKey = new Map<string, SkillKeyword>();

  const add = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    const matched = resumeSupportsSkill(trimmed, profile);
    const existing = byKey.get(key);
    if (!existing || matched) {
      byKey.set(key, { term: trimmed, matched });
    }
  };

  for (const skill of job.skills) add(skill);
  for (const kw of llmKeywords) add(kw.term);

  return [...byKey.values()].sort(
    (a, b) => Number(b.matched) - Number(a.matched)
  );
}

export async function generateMatchInsights(
  profile: InsightProfile,
  job: InsightJob
): Promise<MatchInsightsResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const desc = job.description.slice(0, 4000);
  const listedSkills =
    job.skills.length > 0
      ? job.skills.join(", ")
      : "(none — extract from description only)";

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `=== JOB ===
Title: ${job.title} at ${job.company}
Field: ${job.role_family}
Seniority: ${job.seniority}
Min years: ${job.min_years}

Listed required skills (every one MUST appear in skillKeywords):
${listedSkills}

Job description:
${desc}

=== CANDIDATE (for match flags and insights — do NOT add terms from here) ===
Title: ${profile.title ?? "Not specified"}
Field: ${profile.role_family}
Seniority: ${profile.seniority}
Years: ${profile.years_experience ?? "Not specified"}
Skills: ${profile.skills.join(", ") || "None listed"}
Summary: ${profile.summary ?? "Not provided"}`,
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
    skillKeywords: finalizeSkillKeywords(job, profile, parsed.skillKeywords),
  };
}

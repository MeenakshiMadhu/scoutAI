import OpenAI from "openai";
import { FAMILIES, SENIORITY_ORDER } from "@/lib/store";
import { embedText } from "@/lib/embed";
import { EMBEDDING_MODEL } from "@/lib/embedConfig";
import { normalizePdfText } from "@/lib/resumeProfile";

const MODEL = "gpt-4o-mini";

export type LLMResumeProfile = {
  role_family: string;
  seniority: string;
  title: string;
  skills: string[];
  years_experience: number;
};

export type LLMProfileDebug = {
  normalizedPreview: string;
  yearsExperience: number;
  embedTextPreview: string;
  summary: string;
  source: "openai";
  model: string;
  embeddingModel: string;
};

type LLMExtracted = {
  title: string;
  role_family: string;
  seniority: string;
  years_experience: number;
  skills: string[];
  summary: string;
  embed_text: string;
};

function resumeJsonSchema() {
  return {
    type: "object" as const,
    properties: {
      title: {
        type: "string" as const,
        description: "Most recent or primary professional title from the resume",
      },
      role_family: {
        type: "string" as const,
        enum: [...FAMILIES],
        description: "Closest matching job field from the allowed list",
      },
      seniority: {
        type: "string" as const,
        enum: [...SENIORITY_ORDER],
        description: "Career level inferred from titles and tenure",
      },
      years_experience: {
        type: "number" as const,
        description:
          "Total years of full-time professional experience; exclude internships and education",
      },
      skills: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "Up to 12 relevant skills explicitly mentioned in the resume",
      },
      summary: {
        type: "string" as const,
        description: "Brief professional summary distilled from the resume (2-4 sentences)",
      },
      embed_text: {
        type: "string" as const,
        description:
          "Single paragraph for semantic job matching. Format: " +
          '"{title}. Field: {role_family}. Seniority: {seniority}. Skills: {skills}. {summary and key experience}" ' +
          "Keep under 700 characters.",
      },
    },
    required: [
      "title",
      "role_family",
      "seniority",
      "years_experience",
      "skills",
      "summary",
      "embed_text",
    ] as const,
    additionalProperties: false,
  };
}

const SYSTEM_PROMPT = `You extract structured career profile data from raw resume text (often messy PDF extraction).

Rules:
- Use ONLY information present in the resume. Do not invent employers, skills, or dates.
- years_experience: prefer explicit verbal claims ("10+ years", "+10 years' experience", "4 years of experience"). Otherwise estimate from full-time employment dates only; exclude internships, co-ops, and education periods.
- role_family: choose the single closest value from the allowed enum.
- seniority: infer from job titles and years (Intern / Junior / Mid / Senior / Lead / Director / VP).
- skills: extract skills actually listed or clearly implied by tools/technologies mentioned; max 12.
- embed_text: one dense paragraph matching the job corpus format for vector search:
  "{title}. Field: {role_family}. Seniority: {seniority}. Skills: {comma-separated skills}. {summary plus notable experience}"
  Keep embed_text under 700 characters.`;

export async function buildResumeProfile(rawText: string): Promise<{
  profile: LLMResumeProfile;
  embedding: number[];
  debug: LLMProfileDebug;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local in the scoutAI folder."
    );
  }

  const text = normalizePdfText(rawText).slice(0, 12000);
  if (!text.trim()) {
    throw new Error("No readable text in resume");
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract a structured profile from this resume text:\n\n${text}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_profile",
        strict: true,
        schema: resumeJsonSchema(),
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");

  let parsed: LLMExtracted;
  try {
    parsed = JSON.parse(content) as LLMExtracted;
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const embedding = await embedText(parsed.embed_text);

  return {
    profile: {
      role_family: parsed.role_family,
      seniority: parsed.seniority,
      title: parsed.title,
      skills: parsed.skills.slice(0, 12),
      years_experience: parsed.years_experience,
    },
    embedding,
    debug: {
      normalizedPreview: text.slice(0, 400),
      yearsExperience: parsed.years_experience,
      embedTextPreview: parsed.embed_text.slice(0, 300),
      summary: parsed.summary,
      source: "openai",
      model: MODEL,
      embeddingModel: EMBEDDING_MODEL,
    },
  };
}

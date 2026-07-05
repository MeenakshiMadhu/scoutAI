import { nearestFamily, familyScores } from "@/lib/store";
import { embedText } from "@/lib/embed";

/** pdfreader often glues words — "SoftwareEngineer", "Jul2022-Jul2024" */
/** Some PDFs export with a space between every letter — "S o f t w a r e" */
function collapsePerLetterSpacing(raw: string): string {
  const tokens = raw.trim().split(/\s+/);
  if (tokens.length < 15) return raw;
  const singleChar = tokens.filter((t) => t.length === 1).length;
  // >40% single-char tokens → per-letter spaced PDF
  if (singleChar / tokens.length < 0.4) return raw;
  return raw.replace(/\s+/g, "");
}

export function normalizePdfText(raw: string): string {
  let text = collapsePerLetterSpacing(raw);

  text = text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/(\w)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/gi, "$1 $2")
    // glued section headers: "TXSUMMARYRegistered", "EXPERIENCERegistered"
    .replace(/(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)/gi, " $1 ")
    // glued role words: "Engineerwith", "Nursewith", "RN maria" -> ", RN "
    .replace(/(Engineer|Developer|Nurse|Intern|Manager)(?=[a-z])/gi, "$1 ")
    .replace(/,(RN)\b/gi, ", $1 ")
    .replace(/(\d+)\s*\+\s*years?/gi, "$1 years")
    .replace(/(\d+)years?(?=of|\s)/gi, "$1 years ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

/** Mirror scripts/embed.mjs jobText() so vectors live in the same space */
export function jobStyleEmbedText(
  title: string,
  roleFamily: string,
  seniority: string,
  skills: string[],
  body: string
): string {
  return (
    `${title}. Field: ${roleFamily}. Seniority: ${seniority}. ` +
    `Skills: ${skills.join(", ")}. ${body.slice(0, 600)}`
  );
}

const ROLE_RULES: [RegExp, string][] = [
  [/(?:registered nurse|\brn\b|, rn\b)/i, "Nursing / Clinical"],
  [
    /(?:systems software engineer|software engineer|software developer|full.?stack engineer|backend engineer|frontend engineer|\bswe\b|ios developer|mobile developer|web developer)/i,
    "Software Engineering",
  ],
  [
    /\b(data engineer|analytics engineer|etl developer|dbt\b|airflow)\b/i,
    "Data Engineering",
  ],
  [
    /\b(data scientist|machine learning|ml engineer|deep learning)\b/i,
    "Data Science / ML",
  ],
  [/\b(devops|sre\b|site reliability|platform engineer|kubernetes admin)\b/i, "DevOps / Infrastructure"],
  [/\b(product manager|product owner|pm\b)\b/i, "Product Management"],
  [/\b(ux designer|ui designer|product designer)\b/i, "Design / UX"],
  [/\b(account executive|sales representative|business development)\b/i, "Sales"],
  [/\b(marketing manager|growth marketing|content marketing)\b/i, "Marketing"],
  [/\b(financial analyst|accountant|controller|cfo)\b/i, "Finance / Accounting"],
  [/\b(human resources|hr manager|people operations|recruiter)\b/i, "HR / People"],
  [/\b(paralegal|legal counsel|compliance officer|attorney)\b/i, "Legal / Compliance"],
];

export function inferRoleFamilyFromText(text: string): string | null {
  for (const [re, family] of ROLE_RULES) {
    if (re.test(text)) return family;
  }
  return null;
}

/** Experience section only (roles listed most-recent-first in typical resumes) */
export function getExperienceSection(text: string): string {
  // ALL-CAPS section header — "EXPERIENCE Registered Nurse..."
  let expMatch = text.match(
    /\bEXPERIENCE\b([\s\S]*?)(?=\b(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)\b|$)/i
  );
  if (expMatch) return expMatch[1];

  // Title-case header — "Experience Apple Cupertino..." (not "experience building" in summary)
  expMatch = text.match(
    /\bExperience\s+(?=[A-Z][a-zA-Z]*(?:\s|,))([\s\S]*?)(?=\b(?:Education|Skills|Projects|Certifications)\b|$)/i
  );
  if (expMatch) return expMatch[0];

  expMatch = text.match(
    /(?:professional\s+)?experience([\s\S]*?)(?=\b(?:projects|education|skills|certifications)\b|$)/i
  );
  return expMatch?.[1] ?? text;
}

/** Role title immediately before the first date in the experience block */
export function getMostRecentRoleTitle(text: string): string {
  const exp = getExperienceSection(text);
  const m = exp.match(
    /^[\s]*((?:Senior|Staff|Lead|Junior|Principal|VP|Director of)?\s*(?:Software Development Intern|Software Engineer Intern|Software Engineer|Software Developer|Data Engineer|Registered Nurse|Product Manager|Marketing Manager|DevOps Engineer|Data Scientist)[^•|]*?)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  );
  return m?.[1]?.replace(/\s*[-–—]\s*[A-Za-z0-9 &]+$/i, "").trim() ?? "";
}

/** True when resume shows a non-intern engineering (or similar) role */
export function hasFullTimeRole(exp: string): boolean {
  return (
    /\bsoftware engineer(?! intern)/i.test(exp) ||
    /\bsoftware developer(?! intern)/i.test(exp) ||
    /\b(full.?stack|backend|frontend|mobile|ios) (engineer|developer)(?! intern)/i.test(
      exp
    ) ||
    /\b(registered nurse|product manager|data engineer|devops engineer)(?! intern)/i.test(
      exp
    )
  );
}

/** Prefer the most recent non-intern title for embedding + display */
export function inferTitle(text: string): string {
  const exp = getExperienceSection(text);
  const roleRe =
    /((?:Senior|Staff|Lead|Junior|Principal|VP|Director of)?\s*(?:Software Development Intern|Software Engineer Intern|Software Engineer|Software Developer|Data Engineer|Registered Nurse|Product Manager|Marketing Manager|DevOps Engineer|Data Scientist))[^•|]*?(?=Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/gi;

  for (const m of exp.matchAll(roleRe)) {
    const title = m[1].replace(/\s*[-–—]\s*[A-Za-z0-9 &.'']+$/i, "").trim();
    if (!/\bintern(ship)?\b/i.test(title)) return title.slice(0, 80);
  }

  const recent = getMostRecentRoleTitle(text);
  return recent || "Professional";
}

export function extractSkills(text: string): string[] {
  const known = [
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
    "React",
    "Swift",
    "Go",
    "SQL",
    "Spark",
    "AWS",
    "Kubernetes",
    "Spring Boot",
    "PostgreSQL",
    "Machine Learning",
    "TensorFlow",
    "Figma",
    "Salesforce",
    "Patient Care",
    "HIPAA",
    "Airflow",
    "dbt",
  ];
  const lower = text.toLowerCase();
  return known.filter((s) => lower.includes(s.toLowerCase())).slice(0, 8);
}

/** Sum employment date ranges inside the experience section */
export function estimateYearsExperience(text: string): number {
  const searchText = getExperienceSection(text);

  const rangeRe =
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4})\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4}|Present|Current)/gi;

  let totalMonths = 0;
  let m: RegExpExecArray | null;
  const now = new Date();

  while ((m = rangeRe.exec(searchText)) !== null) {
    const startYear = parseInt(m[1], 10);
    const endRaw = m[2];
    const endYear =
      /present|current/i.test(endRaw) ? now.getFullYear() : parseInt(endRaw, 10);
    totalMonths += Math.max(0, (endYear - startYear) * 12);
  }

  if (totalMonths > 0) return Math.round((totalMonths / 12) * 10) / 10;

  const ym = text.match(/(\d+)\s*\+?\s*years?/i);
  if (ym) return parseInt(ym[1], 10);
  return 0;
}

/** Also used when PDF says "4 + years" in summary, not only in date ranges */
function inferYearsFromText(text: string): number {
  const m = text.match(/(\d+)\s*\+?\s*years?\s+of/i);
  return m ? parseInt(m[1], 10) : 0;
}

export function inferSeniority(text: string): string {
  const t = text.toLowerCase();
  const exp = getExperienceSection(text);
  const yrs = Math.max(estimateYearsExperience(text), inferYearsFromText(text));
  const recentTitle = getMostRecentRoleTitle(text).toLowerCase();
  const fullTime = hasFullTimeRole(exp);

  if (/\b(chief|vp|vice president|head of)\b/.test(t)) return "VP";
  if (/\b(director of|director,)\b/.test(t)) return "Director";
  if (/\b(principal|staff engineer|staff software)\b/.test(t)) return "Lead";
  if (/\b(lead engineer|tech lead|team lead)\b/.test(t)) return "Lead";
  if (/\b(senior|sr\.)\s+(engineer|developer|systems|nurse|analyst|manager)\b/.test(t))
    return "Senior";
  if (/\bsenior\s+systems\s+software\s+engineer\b/.test(t)) return "Senior";

  // Full-time work history beats old intern titles elsewhere in the doc
  if (fullTime) {
    if (/\b(senior|sr\.)\s+(engineer|developer)/i.test(exp)) return "Senior";
    if (yrs >= 8) return "Senior";
    if (yrs >= 5) return "Senior";
    if (yrs >= 2) return "Mid";
    if (yrs >= 0.5) return "Junior";
    return "Junior";
  }

  // Intern/student path — only when no full-time role on record
  if (/\bintern(ship)?\b/.test(recentTitle)) return "Intern";
  if (/\bintern(ship)?\b/.test(exp) && yrs < 1) return "Intern";

  if (yrs >= 8) return "Senior";
  if (yrs >= 5) return "Senior";
  if (yrs >= 2) return "Mid";
  if (yrs >= 0.5) return "Junior";
  return "Junior";
}

export type ResumeProfile = {
  role_family: string;
  seniority: string;
  title: string;
  skills: string[];
  years_experience: number;
};

export type ProfileDebug = {
  normalizedPreview: string;
  ruleBasedFamily: string | null;
  centroidTopFamilies: [string, number][];
  yearsExperience: number;
  embedTextPreview: string;
  mostRecentRole: string;
  hasFullTimeRole: boolean;
  inferredSeniority: string;
};

export async function buildResumeProfile(rawText: string): Promise<{
  profile: ResumeProfile;
  embedding: number[];
  debug: ProfileDebug;
}> {
  const text = normalizePdfText(rawText).slice(0, 8000);
  const exp = getExperienceSection(text);
  const fullTime = hasFullTimeRole(exp);
  const title = inferTitle(text);
  const skills = extractSkills(text);
  const seniority = inferSeniority(text);
  const years_experience = Math.max(
    estimateYearsExperience(text),
    inferYearsFromText(text)
  );

  // quick structured pass for centroid (same shape as jobs)
  const ruleFamily = inferRoleFamilyFromText(text);
  const draftFamily = ruleFamily ?? "Software Engineering";
  const draftEmbed = await embedText(
    jobStyleEmbedText(title, draftFamily, seniority, skills, text)
  );
  const centroidTop = familyScores(draftEmbed)
    .slice(0, 5)
    .map(([f, s]) => [f, Math.round(s * 10000) / 10000] as [string, number]);

  const role_family = ruleFamily ?? nearestFamily(draftEmbed);
  const embedTextFinal = jobStyleEmbedText(
    title,
    role_family,
    seniority,
    skills,
    text
  );
  const embedding = await embedText(embedTextFinal);

  return {
    profile: { role_family, seniority, title, skills, years_experience },
    embedding,
    debug: {
      normalizedPreview: text.slice(0, 400),
      ruleBasedFamily: ruleFamily,
      centroidTopFamilies: centroidTop,
      yearsExperience: years_experience,
      embedTextPreview: embedTextFinal.slice(0, 300),
      mostRecentRole: getMostRecentRoleTitle(text),
      hasFullTimeRole: fullTime,
      inferredSeniority: seniority,
    },
  };
}

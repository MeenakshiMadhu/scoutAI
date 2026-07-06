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

/** Unglue common resume phrases after per-letter collapse */
const GLUED_PHRASES = [
  "digital marketing executive",
  "digital marketing professional",
  "digital marketing",
  "social media",
  "project coordinator",
  "test engineer",
  "software engineer",
  "marketing manager",
  "marketing executive",
  "professional experience",
  "work experience",
  "years of experience",
  "years of",
];

function insertKnownPhrases(text: string): string {
  let out = text;
  for (const phrase of [...GLUED_PHRASES].sort((a, b) => b.length - a.length)) {
    const glued = phrase.replace(/\s+/g, "");
    out = out.replace(new RegExp(glued, "gi"), ` ${phrase} `);
  }
  return out.replace(/\s+/g, " ");
}

export function normalizePdfText(raw: string): string {
  let text = collapsePerLetterSpacing(raw);

  text = text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z][a-z]+)([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/(\w)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/gi, "$1 $2")
    .replace(/(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)/gi, " $1 ")
    .replace(/(Engineer|Developer|Nurse|Intern|Manager|Coordinator|Executive)(?=[a-z])/gi, "$1 ")
    .replace(/,(RN)\b/gi, ", $1 ")
    .replace(/(\d+)\s*\+\s*years?/gi, "$1 years")
    .replace(/(\d+)years?(?=of|\s)/gi, "$1 years ");

  text = insertKnownPhrases(text);

  // MMYYYY-MMYYYY collapsed dates: 122023-032025 → 12/2023-03/2025
  text = text.replace(
    /\b(\d{2})((?:19|20)\d{2})\s*[-–—]\s*(\d{2})((?:19|20)\d{2})\b/g,
    "$1/$2-$3/$4"
  );
  // YYYY-YYYY with optional spaces
  text = text.replace(/\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})\b/g, "$1-$2");

  return text.replace(/\s+/g, " ").trim();
}

import { jobEmbedText } from "@/lib/embedConfig";

/** Same text shape as job corpus — see embedConfig.jobEmbedText */
export function jobStyleEmbedText(
  title: string,
  roleFamily: string,
  seniority: string,
  skills: string[],
  body: string
): string {
  return jobEmbedText({
    title,
    role_family: roleFamily,
    seniority,
    skills,
    description: body,
  });
}

const ROLE_RULES: [RegExp, string][] = [
  [/(?:registered nurse|\brn\b|, rn\b)/i, "Nursing / Clinical"],
  [/(?:marketing manager|marketing executive|digital marketing|growth marketing|content marketing|social media)/i, "Marketing"],
  [/(?:project coordinator|test engineer|systems software engineer|software engineer|software developer|full.?stack engineer|backend engineer|frontend engineer|\bswe\b|ios developer|mobile developer|web developer)/i, "Software Engineering"],
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
  const stop = `(?=\\b(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS)\\b|$)`;
  const headers = [
    new RegExp(`\\bPROFESSIONAL EXPERIENCE\\b([\\s\\S]*?)${stop}`, "i"),
    new RegExp(`\\bWORK EXPERIENCE\\b([\\s\\S]*?)${stop}`, "i"),
    // Title-case before bare EXPERIENCE — avoids matching "years of experience" in summary
    /\bExperience\s+(?=[A-Z][a-zA-Z]*(?:\s|,|\())([\s\S]*?)(?=\b(?:Education|Skills|Projects|Certifications)\b|$)/i,
    new RegExp(`\\b(?<!years\\s+of\\s)EXPERIENCE\\b([\\s\\S]*?)${stop}`, "i"),
  ];

  for (const re of headers) {
    const m = text.match(re);
    const body = m?.[1] ?? m?.[0];
    if (body && body.trim().length > 15) return body;
  }

  return text;
}

const ROLE_TITLE_PATTERN =
  "(?:Senior|Staff|Lead|Junior|Principal|VP|Director of)?\\s*" +
  "(?:Software Development Intern|Software Engineer Intern|Software Engineer|Software Developer|" +
  "Data Engineer|Registered Nurse|Product Manager|Marketing Manager|Digital Marketing Executive|" +
  "DevOps Engineer|Data Scientist|Test Engineer|Project Coordinator)";

const DATE_START =
  "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\\d{4}|\\d{1,2}/\\d{4})";

/** Role title immediately before the first date in the experience block */
export function getMostRecentRoleTitle(text: string): string {
  const exp = getExperienceSection(text);
  const m = exp.match(
    new RegExp(
      `^[\\s]*(${ROLE_TITLE_PATTERN}[^•|]*?)\\s*${DATE_START}`,
      "i"
    )
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
    /\b(registered nurse|product manager|data engineer|devops engineer|test engineer|project coordinator)(?! intern)/i.test(
      exp
    ) ||
    /\b(digital marketing executive|marketing manager|marketing executive)(?! intern)/i.test(
      exp
    )
  );
}

/** Prefer the most recent non-intern title for embedding + display */
export function inferTitle(text: string): string {
  const exp = getExperienceSection(text);
  const roleRe = new RegExp(
    `(${ROLE_TITLE_PATTERN})[^•|]*?(?=${DATE_START})`,
    "gi"
  );

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
  const found: string[] = [];
  for (const skill of known) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re =
      skill.length <= 3
        ? new RegExp(`\\b${escaped}\\b`, "i")
        : new RegExp(escaped, "i");
    if (re.test(text)) found.push(skill);
  }
  return found.slice(0, 8);
}

/** Summary / header block before experience or education sections */
function getSummarySection(text: string): string {
  const marker =
    /\b(?:PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|(?<!\byears\s+of\s)EXPERIENCE|EDUCATION)\b/i;
  const m = text.match(marker);
  if (m?.index != null && m.index > 0) return text.slice(0, m.index);
  return text.slice(0, 1200);
}

/** Explicit "4+ years of experience" claims in summary — highest priority */
function parseVerbalYears(text: string): number | null {
  const summary = getSummarySection(text);
  const patterns = [
    /(\d+)\s*\+\s*years?\s*(?:of\s*)?(?:[\w-]+\s+){0,4}?(?:experience|exp)\b/i,
    /(\d+)\s*years?\s*(?:\+)?\s*of\s+(?:professional\s+)?(?:experience|exp)\b/i,
    /(?:over|more than|at least)\s*(\d+)\s*\+?\s*years?\b/i,
    /with\s+(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:professional\s+)?(?:experience|exp)\b/i,
  ];
  for (const re of patterns) {
    const m = summary.match(re);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

const MONTH_NUM: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function monthToNum(name: string): number {
  return MONTH_NUM[name.slice(0, 4).toLowerCase()] ?? MONTH_NUM[name.slice(0, 3).toLowerCase()] ?? 1;
}

function isInternContext(beforeDate: string): boolean {
  return /\bintern(ship)?\b/i.test(beforeDate.slice(-160));
}

function isEducationContext(beforeDate: string): boolean {
  return /\b(education|university|college|bachelor|master|b\.?tech|m\.?sc|gpa|coursework|degree|school|institute)\b/i.test(
    beforeDate.slice(-140)
  );
}

function shouldSkipRange(contextBefore: string): boolean {
  return isInternContext(contextBefore) || isEducationContext(contextBefore);
}

/** Sum full-time employment months from date ranges (skips intern + education ranges) */
function collectFullTimeEmploymentMonths(searchText: string): number {
  let totalMonths = 0;
  let m: RegExpExecArray | null;
  const now = new Date();

  const monthRangeRe =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4})\s*[-–—]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4}|Present|Current)/gi;
  while ((m = monthRangeRe.exec(searchText)) !== null) {
    const ctx = searchText.slice(Math.max(0, m.index - 160), m.index);
    if (shouldSkipRange(ctx)) continue;
    const startYear = parseInt(m[2], 10);
    const startMonth = monthToNum(m[1]);
    const endIsPresent = /present|current/i.test(m[4]);
    const endYear = endIsPresent ? now.getFullYear() : parseInt(m[4], 10);
    const endMonth = endIsPresent ? now.getMonth() + 1 : monthToNum(m[3]);
    totalMonths += monthsBetween(startYear, endYear, startMonth, endMonth);
  }

  const monthPresentRe =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4})\s*[-–—|]*\s*(Present|Current)\b/gi;
  while ((m = monthPresentRe.exec(searchText)) !== null) {
    const ctx = searchText.slice(Math.max(0, m.index - 160), m.index);
    if (shouldSkipRange(ctx)) continue;
    totalMonths += monthsBetween(
      parseInt(m[2], 10),
      now.getFullYear(),
      monthToNum(m[1]),
      now.getMonth() + 1
    );
  }

  const slashRe =
    /\b(\d{1,2})\/((?:19|20)\d{2})\s*[-–—]\s*(\d{1,2})\/((?:19|20)\d{2}|Present|Current)\b/gi;
  while ((m = slashRe.exec(searchText)) !== null) {
    const ctx = searchText.slice(Math.max(0, m.index - 160), m.index);
    if (shouldSkipRange(ctx)) continue;
    const startYear = parseInt(m[2], 10);
    const startMonth = parseInt(m[1], 10);
    const endIsPresent = /present|current/i.test(m[4]);
    const endYear = endIsPresent ? now.getFullYear() : parseInt(m[4], 10);
    const endMonth = endIsPresent ? now.getMonth() + 1 : parseInt(m[3], 10);
    totalMonths += monthsBetween(startYear, endYear, startMonth, endMonth);
  }

  const yearRangeRe =
    /\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|Present|Current)\b/gi;
  while ((m = yearRangeRe.exec(searchText)) !== null) {
    const ctx = searchText.slice(Math.max(0, m.index - 160), m.index);
    if (shouldSkipRange(ctx)) continue;
    const startYear = parseInt(m[1], 10);
    const endRaw = m[2];
    const endYear = /present|current/i.test(endRaw) ? now.getFullYear() : parseInt(endRaw, 10);
    totalMonths += monthsBetween(startYear, endYear);
  }

  return totalMonths;
}

function monthsBetween(startYear: number, endYear: number, startMonth = 1, endMonth = 12): number {
  return Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth));
}

function countDateRanges(text: string): number {
  const monthRe =
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–—]/gi;
  const yearRe = /\b(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}|Present|Current\b/gi;
  const slashRe = /\b\d{1,2}\/(?:19|20)\d{2}\s*[-–—]/gi;
  return (
    (text.match(monthRe)?.length ?? 0) +
    (text.match(yearRe)?.length ?? 0) +
    (text.match(slashRe)?.length ?? 0)
  );
}

function experienceSectionLooksValid(exp: string): boolean {
  if (exp.length < 80) return false;
  if (/\b(?:years of experience|buildinglow-latency)\b/i.test(exp.slice(0, 150))) return false;
  return /\b(?:full.?time|engineer|developer|manager|coordinator|nurse|analyst|\(\d{4}\)|\/\d{4})/i.test(
    exp
  );
}

/** Best-effort work-history text for date/title parsing across PDF layout quirks */
function getWorkHistoryText(text: string): string {
  const exp = getExperienceSection(text);
  const eduIdx = text.search(/\bEDUCATION\b/i);
  const preEdu = eduIdx >= 0 ? text.slice(0, eduIdx) : text;

  const expDates = countDateRanges(exp);
  const preDates = countDateRanges(preEdu);
  const validExp = experienceSectionLooksValid(exp);

  // Multi-column PDFs: job dates appear before the EXPERIENCE header (still pre-EDUCATION)
  if (preDates > expDates && preEdu.length > 80 && !validExp) return preEdu;

  if (validExp) return exp;

  if (expDates > 0) return exp;

  // Education section listed before experience (common in some templates)
  if (eduIdx >= 0) {
    const expAfterEdu = getExperienceSection(text.slice(eduIdx));
    if (countDateRanges(expAfterEdu) > 0) return expAfterEdu;
  }

  return exp.length > 20 ? exp : text;
}

/**
 * Years of experience:
 * 1. Verbal claim in summary ("4+ years of experience") — wins if present
 * 2. Else sum full-time date ranges in the experience section (intern + education ranges skipped)
 */
export function estimateYearsExperience(text: string): number {
  const verbal = parseVerbalYears(text);
  if (verbal != null) return verbal;

  const searchText = getWorkHistoryText(text);
  const totalMonths = collectFullTimeEmploymentMonths(searchText);
  if (totalMonths > 0) return Math.round((totalMonths / 12) * 10) / 10;
  return 0;
}

export function inferSeniority(text: string): string {
  const t = text.toLowerCase();
  const exp = getExperienceSection(text);
  const yrs = estimateYearsExperience(text);
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

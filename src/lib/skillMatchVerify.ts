export type ProfileForSkillMatch = {
  title?: string;
  role_family: string;
  summary?: string;
  skills: string[];
};

/** Known aliases so resume ↔ JD matching survives formatting differences. */
const SYNONYMS: Record<string, string[]> = {
  aws: ["amazon web services", "amazon aws"],
  gcp: ["google cloud", "google cloud platform"],
  azure: ["microsoft azure"],
  kubernetes: ["k8s"],
  postgresql: ["postgres", "psql"],
  javascript: ["js"],
  typescript: ["ts"],
  "ci/cd": ["cicd", "continuous integration", "continuous deployment"],
  "rest apis": ["rest", "restful", "rest api"],
  "rest api": ["rest", "restful", "rest apis"],
  golang: ["go"],
  go: ["golang"],
  react: ["react.js", "reactjs"],
  "node.js": ["node", "nodejs"],
  docker: ["containerization", "containers"],
};

function profileHaystack(profile: ProfileForSkillMatch): string {
  return [
    profile.title,
    profile.role_family,
    profile.summary,
    ...profile.skills,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function wordBoundary(text: string, word: string): boolean {
  const w = word.toLowerCase().trim();
  if (!w) return false;
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/** True when the candidate profile supports a JD skill/keyword term. */
export function resumeSupportsSkill(
  term: string,
  profile: ProfileForSkillMatch
): boolean {
  const haystack = profileHaystack(profile);
  const t = term.toLowerCase().trim();
  if (!t) return false;

  if (wordBoundary(haystack, t)) return true;

  for (const skill of profile.skills) {
    const s = skill.toLowerCase().trim();
    if (s === t || s.includes(t) || t.includes(s)) return true;
  }

  const aliases = SYNONYMS[t] ?? [];
  if (aliases.some((alias) => wordBoundary(haystack, alias))) return true;

  for (const skill of profile.skills) {
    const s = skill.toLowerCase();
    const skillAliases = SYNONYMS[s] ?? [];
    if (skillAliases.some((alias) => wordBoundary(t, alias) || t.includes(alias)))
      return true;
  }

  const words = t.split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 1 && words.every((w) => wordBoundary(haystack, w))) {
    return true;
  }

  if (/cloud infrastructure|cloud platforms?/i.test(t)) {
    const cloudTokens = [
      "aws",
      "azure",
      "gcp",
      "google cloud",
      "kubernetes",
      "docker",
      "terraform",
      "cloud computing",
    ];
    const hits = profile.skills.filter((s) => {
      const sl = s.toLowerCase();
      return cloudTokens.some((c) => sl.includes(c));
    }).length;
    if (hits >= 2) return true;
    if (wordBoundary(haystack, "cloud")) return true;
  }

  return false;
}

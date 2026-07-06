import type { InsightProfile, SkillKeyword } from "@/lib/matchInsights";

export type CachedJobInsights = {
  insights: string[];
  skillKeywords: SkillKeyword[];
};

const store = new Map<string, CachedJobInsights>();

export function insightsCacheKey(
  jobId: string,
  profile: InsightProfile
): string {
  const profileSig = [
    profile.title ?? "",
    profile.role_family,
    profile.skills.join("\x1f"),
    profile.summary ?? "",
  ].join("\x1e");
  return `${jobId}\x1e${profileSig}`;
}

export function getCachedInsights(
  key: string
): CachedJobInsights | undefined {
  return store.get(key);
}

export function setCachedInsights(
  key: string,
  data: CachedJobInsights
): void {
  store.set(key, data);
}

export function clearInsightsCache(): void {
  store.clear();
}

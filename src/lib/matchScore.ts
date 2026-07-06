/** Map cosine scores within a batch to a user-friendly 62–95% range. */
export function attachMatchPercents<T extends { score: number }>(
  items: T[]
): (T & { matchPercent: number })[] {
  if (items.length === 0) return [];
  const scores = items.map((i) => i.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;

  return items.map((item) => ({
    ...item,
    matchPercent:
      range === 0 ? 92 : Math.round(62 + ((item.score - min) / range) * 33),
  }));
}

export function matchPercentColor(percent: number): string {
  if (percent >= 85) return "text-emerald-700";
  if (percent >= 75) return "text-emerald-600";
  if (percent >= 68) return "text-amber-700";
  return "text-amber-600";
}

export function matchPercentBg(percent: number): string {
  if (percent >= 85) return "from-emerald-50 to-teal-50 border-emerald-200";
  if (percent >= 75) return "from-emerald-50/80 to-amber-50/60 border-emerald-200/80";
  return "from-amber-50 to-orange-50/60 border-amber-200";
}

import type {
  DashboardDistributionItem,
  DashboardTrendPoint,
} from "@/types/contracts";

export function distribution(
  values: readonly string[],
): DashboardDistributionItem[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      key,
      count,
      percentage: values.length ? Math.round((count / values.length) * 100) : 0,
    }));
}

export function dateKey(value: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function sevenDayTrend(
  timestamps: readonly string[],
  now: Date,
  timezone: string,
): DashboardTrendPoint[] {
  const counts = new Map<string, number>();
  for (const timestamp of timestamps) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.valueOf())) {
      const key = dateKey(date, timezone);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = dateKey(date, timezone);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

export function estimatedTimeSaved(input: {
  analyses: number;
  acceptedTasks: number;
  drafts: number;
}): number {
  return input.analyses * 2 + input.acceptedTasks + input.drafts * 3;
}

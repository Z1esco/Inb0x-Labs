import { AppError } from "@/lib/errors";

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();
export function enforceRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): void {
  const key = `${userId}:${action}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit)
    throw new AppError(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429,
    );
  current.count += 1;
}
export function clearRateLimits(): void {
  buckets.clear();
}

import { AppError } from "@/lib/errors";

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
let nextCleanupAt = 0;
export function enforceRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): void {
  if (now >= nextCleanupAt) {
    for (const [key, bucket] of buckets)
      if (bucket.resetAt <= now) buckets.delete(key);
    nextCleanupAt = now + 60_000;
  }
  const key = `${userId}:${action}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= MAX_BUCKETS)
      throw new AppError(
        "RATE_LIMITED",
        "Too many requests. Please try again later.",
        429,
      );
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
export function clearRateLimits(preserve?: {
  userId: string;
  action: string;
}): void {
  const key = preserve ? `${preserve.userId}:${preserve.action}` : undefined;
  const retained = key ? buckets.get(key) : undefined;
  buckets.clear();
  nextCleanupAt = 0;
  if (key && retained) buckets.set(key, retained);
}

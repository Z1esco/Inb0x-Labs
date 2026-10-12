import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit, clearRateLimits } from "@/server/rate-limit/limiter";
import { resetDemo } from "@/server/services/demo-store";
export async function POST() {
  try {
    const user = await requireCurrentUser();
    if (!user.demo)
      throw new AppError(
        "DEMO_MODE_ONLY",
        "Demo reset is available only in demo mode.",
        409,
      );
    // Resetting fictional fixtures must not reset the reset endpoint's own budget.
    enforceRateLimit(user.id, "demo-reset", 30, 60_000);
    resetDemo();
    clearRateLimits({ userId: user.id, action: "demo-reset" });
    return ok({ reset: true }, { demo: true });
  } catch (error) {
    return failure(error);
  }
}

import { failure, ok } from "@/lib/api-response";
import { updateSettingsSchema } from "@/schemas/settings";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import {
  getSettings,
  updateSettings,
} from "@/server/settings/settings-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return ok(await getSettings(user), { demo: user.demo });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = updateSettingsSchema.parse(await request.json());
    enforceRateLimit(user.id, "settings-update", 30, 60_000);
    return ok(await updateSettings(user, input), { demo: user.demo });
  } catch (error) {
    return failure(error);
  }
}

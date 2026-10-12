import { failure, ok } from "@/lib/api-response";
import { deleteAccountSchema } from "@/schemas/settings";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { deleteAccount, getAccount } from "@/server/settings/settings-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "account-export", 5, 60_000);
    return ok(await getAccount(user), { demo: user.demo, format: "json" });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser();
    deleteAccountSchema.parse(await request.json());
    enforceRateLimit(user.id, "account-delete", 3, 60_000);
    return ok(await deleteAccount(user), { demo: user.demo });
  } catch (error) {
    return failure(error);
  }
}

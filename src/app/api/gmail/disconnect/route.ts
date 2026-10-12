import { failure, ok } from "@/lib/api-response";
import { requireCurrentUser } from "@/server/auth/current-user";
import { disconnectGmail } from "@/server/gmail/connection-service";
export async function POST() {
  try {
    const user = await requireCurrentUser();
    if (!user.demo) await disconnectGmail(user.id);
    return ok({ disconnected: true });
  } catch (error) {
    return failure(error);
  }
}

import { failure, ok } from "@/lib/api-response";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getGmailConnectionStatus } from "@/server/gmail/connection-service";
export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.demo)
      return ok(
        {
          connected: true,
          gmailAddress: "judge@inb0x.demo",
          grantedScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
          connectedAt: "2026-07-01T00:00:00.000Z",
          lastSyncedAt: null,
          requiresReauthorization: false,
          readOnly: true as const,
        },
        { demo: true },
      );
    return ok(await getGmailConnectionStatus(user.id));
  } catch (error) {
    return failure(error);
  }
}

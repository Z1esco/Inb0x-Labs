import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { failure } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { exchangeAndStoreGoogleCode } from "@/server/gmail/connection-service";
import { verifyOAuthState } from "@/server/security/oauth-state";
export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const denied = request.nextUrl.searchParams.get("error");
    if (denied)
      throw new AppError(
        "GMAIL_PERMISSION_DENIED",
        "Gmail authorization was denied.",
        403,
      );
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const store = await cookies();
    const expected = store.get("inb0x_oauth_state")?.value;
    if (!code || !state || !expected || state !== expected)
      throw new AppError("FORBIDDEN", "The Gmail callback is invalid.", 403);
    verifyOAuthState(state, getEnvironment().OAUTH_STATE_SECRET!, user.id);
    await exchangeAndStoreGoogleCode(user.id, code);
    store.delete("inb0x_oauth_state");
    return NextResponse.redirect(
      new URL("/settings?gmail=connected", request.url),
    );
  } catch (error) {
    return failure(error);
  }
}

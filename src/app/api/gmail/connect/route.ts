import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { failure } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { shouldForceGoogleConsent } from "@/server/gmail/connection-service";
import { buildGoogleAuthorizationUrl } from "@/server/gmail/oauth";
import { issueOAuthState } from "@/server/security/oauth-state";
export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.demo)
      throw new AppError(
        "DEMO_MODE_ONLY",
        "Gmail connection is disabled in demo mode.",
        409,
      );
    const state = await issueOAuthState(user.id);
    const forceConsent = await shouldForceGoogleConsent(user.id);
    const store = await cookies();
    store.set("inb0x_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/api/gmail/callback",
    });
    return NextResponse.redirect(
      buildGoogleAuthorizationUrl(state, forceConsent),
    );
  } catch (error) {
    return failure(error);
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { failure } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { buildGoogleAuthorizationUrl } from "@/server/gmail/oauth";
import { createOAuthState } from "@/server/security/oauth-state";
export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.demo)
      throw new AppError(
        "DEMO_MODE_ONLY",
        "Gmail connection is disabled in demo mode.",
        409,
      );
    const state = createOAuthState(
      user.id,
      getEnvironment().OAUTH_STATE_SECRET!,
    );
    const store = await cookies();
    store.set("inb0x_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/api/gmail/callback",
    });
    return NextResponse.redirect(buildGoogleAuthorizationUrl(state));
  } catch (error) {
    return failure(error);
  }
}
export const POST = GET;

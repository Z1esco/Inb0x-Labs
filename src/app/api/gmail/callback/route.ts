import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { failure } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { exchangeAndStoreGoogleCode } from "@/server/gmail/connection-service";
import {
  consumeOAuthState,
  stateValuesMatch,
} from "@/server/security/oauth-state";

const OAUTH_COOKIE = "inb0x_oauth_state";

function fixedRedirect(path: string): NextResponse {
  return NextResponse.redirect(
    new URL(path, getEnvironment().NEXT_PUBLIC_APP_URL),
  );
}

export async function GET(request: NextRequest) {
  const store = await cookies();
  try {
    const user = await requireCurrentUser();
    const receivedState = request.nextUrl.searchParams.get("state") ?? "";
    const expectedState = store.get(OAUTH_COOKIE)?.value ?? "";
    if (
      !receivedState ||
      !expectedState ||
      !stateValuesMatch(receivedState, expectedState)
    )
      throw new AppError(
        "OAUTH_STATE_INVALID",
        "The Gmail authorization request is invalid.",
        403,
      );

    await consumeOAuthState(receivedState, user.id);
    const providerError = request.nextUrl.searchParams.get("error");
    if (providerError)
      throw new AppError(
        "OAUTH_ACCESS_DENIED",
        "Gmail authorization was denied.",
        403,
      );
    const code = request.nextUrl.searchParams.get("code");
    if (!code)
      throw new AppError(
        "INVALID_REQUEST",
        "Google did not return an authorization code.",
        400,
      );
    await exchangeAndStoreGoogleCode(user.id, code);
    return fixedRedirect("/dashboard?gmail=connected");
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "OAUTH_ACCESS_DENIED")
        return fixedRedirect("/settings?gmail=denied");
      if (
        error.code === "OAUTH_STATE_INVALID" ||
        error.code === "OAUTH_STATE_EXPIRED"
      )
        return fixedRedirect("/settings?gmail=error");
    }
    return failure(error);
  } finally {
    store.delete(OAUTH_COOKIE);
  }
}

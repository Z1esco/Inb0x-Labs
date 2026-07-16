import { NextResponse } from "next/server";
import { failure } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET() {
  try {
    const env = getEnvironment();
    if (env.DEMO_MODE)
      return NextResponse.redirect(
        new URL("/dashboard", env.NEXT_PUBLIC_APP_URL),
      );
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    });
    if (error || !data.url)
      throw new AppError(
        "INTERNAL_ERROR",
        "Sign-in could not be started.",
        500,
      );
    return NextResponse.redirect(data.url);
  } catch (error) {
    return failure(error);
  }
}

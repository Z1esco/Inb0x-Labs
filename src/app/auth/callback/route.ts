import { NextResponse, type NextRequest } from "next/server";
import { getEnvironment } from "@/lib/env";
import { redirectOrigin } from "@/lib/redirect-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const env = getEnvironment();
  const appUrl = redirectOrigin(env);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?auth=error", appUrl));

  if (env.DEMO_MODE)
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(
      new URL(error ? "/login?auth=error" : "/dashboard", appUrl),
    );
  } catch {
    return NextResponse.redirect(new URL("/login?auth=error", appUrl));
  }
}

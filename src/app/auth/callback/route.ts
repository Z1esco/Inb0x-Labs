import { NextResponse, type NextRequest } from "next/server";
import { getEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const appUrl = getEnvironment().NEXT_PUBLIC_APP_URL;
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?auth=error", appUrl));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(
    new URL(error ? "/login?auth=error" : "/dashboard", appUrl),
  );
}

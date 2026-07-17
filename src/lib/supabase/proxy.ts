import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnvironment } from "@/lib/env";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

export async function refreshSupabaseSession(request: NextRequest) {
  const env = getEnvironment();
  if (env.DEMO_MODE) return NextResponse.next({ request });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(env.NEXT_PUBLIC_APP_URL),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verifies the session with Supabase and refreshes expired auth cookies. A
  // provider outage must not take down public pages; protected layouts still
  // fail closed when they perform their own user check.
  await supabase.auth.getUser().catch(() => undefined);
  return response;
}

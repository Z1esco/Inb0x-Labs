import { createClient } from "@supabase/supabase-js";
import { getEnvironment } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = getEnvironment();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Supabase server configuration is missing");
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

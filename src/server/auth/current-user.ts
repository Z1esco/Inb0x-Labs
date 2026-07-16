import { AppError } from "@/lib/errors";
import { getEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  demo: boolean;
}
export async function requireCurrentUser(): Promise<CurrentUser> {
  if (getEnvironment().DEMO_MODE)
    return {
      id: "00000000-0000-4000-8000-000000000001",
      email: "judge@inb0x.demo",
      demo: true,
    };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  return { id: data.user.id, email: data.user.email ?? null, demo: false };
}

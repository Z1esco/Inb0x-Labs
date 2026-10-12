import { failure, ok } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const env = getEnvironment();
    if (!env.DEMO_MODE) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error)
        throw new AppError(
          "INTERNAL_ERROR",
          "Sign-out could not be completed.",
          500,
        );
    }
    return ok({ signedOut: true }, { demo: env.DEMO_MODE });
  } catch (error) {
    return failure(error);
  }
}

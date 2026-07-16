import { getEnvironment } from "@/lib/env";
import { failure, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const env = getEnvironment();
    return ok({
      status: "ok",
      demoMode: env.DEMO_MODE,
      configured: {
        database: Boolean(
          env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
        ),
        openai: Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL),
        googleOAuth: Boolean(
          env.GOOGLE_CLIENT_ID &&
          env.GOOGLE_CLIENT_SECRET &&
          env.GOOGLE_REDIRECT_URI,
        ),
      },
    });
  } catch (error) {
    return failure(error);
  }
}

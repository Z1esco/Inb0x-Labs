import type { Environment } from "@/lib/env";

/** Preview demo navigation stays on its deployment, never an old shared config URL.
 * Real OAuth keeps the configured origin so its callback allowlist stays explicit.
 * Only platform environment is trusted here, never request Host/forwarded headers.
 */
export function redirectOrigin(
  env: Pick<Environment, "DEMO_MODE" | "NEXT_PUBLIC_APP_URL">,
  platform: Record<string, string | undefined> = process.env,
): string {
  if (env.DEMO_MODE && platform.VERCEL_ENV === "preview" && platform.VERCEL_URL)
    return new URL(`https://${platform.VERCEL_URL}`).origin;
  return env.NEXT_PUBLIC_APP_URL;
}

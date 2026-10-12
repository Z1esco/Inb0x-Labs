export function getSupabaseCookieOptions(appUrl: string) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: new URL(appUrl).protocol === "https:",
  };
}

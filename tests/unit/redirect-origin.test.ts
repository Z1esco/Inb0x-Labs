import { expect, it } from "vitest";
import { redirectOrigin } from "@/lib/redirect-origin";

const platform = { VERCEL_ENV: "preview", VERCEL_URL: "current.vercel.app" };
it("keeps fictional Preview entry on the current deployment despite stale shared configuration", () => {
  expect(
    redirectOrigin(
      { DEMO_MODE: true, NEXT_PUBLIC_APP_URL: "https://old.vercel.app" },
      platform,
    ),
  ).toBe("https://current.vercel.app");
});
it("preserves Production and real OAuth configured origins", () => {
  const env = { DEMO_MODE: true, NEXT_PUBLIC_APP_URL: "https://inb0x.my" };
  expect(redirectOrigin(env, { ...platform, VERCEL_ENV: "production" })).toBe(
    "https://inb0x.my",
  );
  expect(redirectOrigin({ ...env, DEMO_MODE: false }, platform)).toBe(
    "https://inb0x.my",
  );
});

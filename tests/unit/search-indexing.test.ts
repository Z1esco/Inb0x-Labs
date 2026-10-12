import { afterEach, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import config from "../../next.config";

afterEach(() => vi.unstubAllEnvs());
it("indexes only the public marketing URL and excludes private routes", () => {
  vi.stubEnv("VERCEL_ENV", "production");
  expect(sitemap()).toEqual([{ url: "https://inb0x.my/" }]);
  expect(robots()).toMatchObject({
    rules: {
      disallow: expect.arrayContaining([
        "/api/",
        "/dashboard",
        "/inbox",
        "/settings",
      ]),
    },
    sitemap: "https://inb0x.my/sitemap.xml",
  });
});
it("keeps Preview pages out of search engines", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  expect(sitemap()).toEqual([]);
  expect(await config.headers?.()).toContainEqual({
    source: "/:path*",
    headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
  });
});

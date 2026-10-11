import { describe, expect, it } from "vitest";
import config from "../../next.config";

describe("browser security headers", () => {
  it("protects every route against framing, MIME sniffing and referrer disclosure", async () => {
    const rules = await config.headers?.();
    const global = rules?.find((rule) => rule.source === "/:path*");
    expect(global?.headers).toEqual(
      expect.arrayContaining([
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ]),
    );
  });
});

import { expect, test } from "@playwright/test";

const routes = [
  ["landing", "/"],
  ["login", "/login"],
  ["dashboard", "/dashboard"],
  ["inbox", "/inbox"],
  ["thread", "/inbox/proposal-approval"],
  ["tasks", "/tasks"],
  ["drafts", "/drafts"],
  ["insights", "/insights"],
  ["settings", "/settings"],
] as const;

for (const width of [360, 390, 768, 1024, 1280, 1440, 1920]) {
  test(`all routes are usable at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.request.post("/api/demo/reset");
    await page.goto("/inbox/proposal-approval");
    await page
      .getByRole("button", { name: "Prepare reply", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Copy reply", exact: true }),
    ).toBeVisible();
    for (const [name, path] of routes) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(
        page.locator(".loading-ledger, .loading-letter, .skeleton"),
      ).toHaveCount(0);
      if (name === "settings")
        await expect(
          page.getByLabel("Appearance", { exact: true }),
        ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).scrollBehavior,
        ),
      ).toBe("auto");
      await expect(page.locator('main [role="alert"]')).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      expect(overflow, `${name} at ${width}px`).toBeLessThanOrEqual(0);
      if (name === "drafts") {
        await expect(page.locator(".draft-paper")).toBeVisible();
        const contrast = await page
          .locator(".draft-paper")
          .evaluate((paper) => {
            function luminance(color: string) {
              const channels = color
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number);
              const linear = channels.map((channel) => {
                const value = channel / 255;
                return value <= 0.04045
                  ? value / 12.92
                  : ((value + 0.055) / 1.055) ** 2.4;
              });
              return (
                linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
              );
            }
            const foreground = luminance(
              getComputedStyle(paper.querySelector("p")!).color,
            );
            const background = luminance(
              getComputedStyle(paper).backgroundColor,
            );
            return (
              (Math.max(foreground, background) + 0.05) /
              (Math.min(foreground, background) + 0.05)
            );
          });
        expect(contrast, "reply body contrast").toBeGreaterThanOrEqual(4.5);
      }
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
  });
}

test("analysis and acceptance require explicit action, with source evidence", async ({
  page,
}) => {
  await page.request.post("/api/demo/reset");
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST")
      calls.push(new URL(request.url()).pathname);
  });
  await page.goto("/inbox/proposal-approval");
  await expect(
    page.getByRole("heading", { name: "What this thread means" }),
  ).toBeVisible();
  expect(calls).toEqual([]);
  await page
    .getByRole("button", { name: "Analyze thread", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    /Analysis ready|Cached analysis/,
  );
  expect(calls.filter((path) => path === "/api/analysis/thread")).toHaveLength(
    1,
  );
  expect(
    calls.filter((path) => path === "/api/tasks/from-analysis"),
  ).toHaveLength(0);
  await page.getByRole("link", { name: "View source message" }).first().click();
  await expect(page.locator(".letter:target")).toBeVisible();
  await page.getByRole("button", { name: "Accept task" }).first().click();
  await expect(page.getByRole("status")).toContainText(
    /added to Tasks|already in Tasks/,
  );
  expect(
    calls.filter((path) => path === "/api/tasks/from-analysis"),
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "Prepare reply", exact: true })
    .click();
  await expect(
    page.locator(".studio-result").getByText("Confidence", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  await page.goto("/drafts");
  await page.getByRole("link", { name: "View source message" }).first().click();
  await expect(page.locator(".letter:target")).toBeVisible();
});

test("mobile navigation traps focus, restores focus and exposes account exit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await trigger.click();
  const close = page.getByRole("button", {
    name: "Close navigation",
    exact: true,
  });
  await expect(close).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Exit demo", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Exit demo", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("complementary", { name: "Primary navigation" }),
  ).toBeHidden();
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator(".desk-canvas")).not.toHaveAttribute("inert", "");
});

test("inbox errors can recover and empty search remains actionable", async ({
  page,
}) => {
  await page.route("**/api/gmail/threads", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Inbox temporarily unavailable.",
          requestId: "synthetic-qa",
        },
      }),
    }),
  );
  await page.goto("/inbox");
  await expect(page.locator('main [role="alert"]')).toContainText(
    "Inbox temporarily unavailable.",
  );
  await page.unroute("**/api/gmail/threads");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.locator('a[href="/inbox/proposal-approval"]'),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search inbox" })
    .fill("no-such-fictional-conversation-7391");
  await expect(page.locator(".state-sheet")).toBeVisible();
  await page.getByRole("textbox", { name: "Search inbox" }).fill("");
  await expect(
    page.locator('a[href="/inbox/proposal-approval"]'),
  ).toBeVisible();
});

test("browser responses enforce the configured privacy headers", async ({
  request,
}) => {
  for (const path of ["/", "/dashboard", "/api/dashboard"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  }
});

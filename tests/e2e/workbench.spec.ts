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

test("task and saved reply deletion require confirmation and support cancellation", async ({
  page,
}) => {
  await page.request.post("/api/demo/reset");
  await page.goto("/tasks");
  await page
    .getByPlaceholder("Write the next action, not the entire project")
    .fill("Deletion confirmation example");
  await page
    .getByRole("button", { name: "Add to the ledger", exact: true })
    .click();
  const dialogs: string[] = [];
  let confirm = false;
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    if (confirm) await dialog.accept();
    else await dialog.dismiss();
  });
  const deleteTask = page.getByRole("button", {
    name: "Delete Deletion confirmation example",
    exact: true,
  });
  await deleteTask.click();
  expect(dialogs).toHaveLength(1);
  await expect(deleteTask).toBeVisible();
  confirm = true;
  await deleteTask.click();
  await expect(deleteTask).toHaveCount(0);
  await page.goto("/inbox/proposal-approval");
  await page
    .getByRole("button", { name: "Prepare reply", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copy reply", exact: true }),
  ).toBeVisible();
  await page.goto("/drafts");
  confirm = false;
  const deleteDraft = page.getByRole("button", {
    name: "Delete this draft",
    exact: true,
  });
  await deleteDraft.click();
  expect(dialogs).toHaveLength(3);
  await expect(deleteDraft).toBeVisible();
  confirm = true;
  await deleteDraft.click();
  await expect(
    page.getByRole("heading", { name: "The writing room is quiet" }),
  ).toBeVisible();
});

for (const [width, height] of [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
]) {
  test(`all routes are usable at ${width}px`, async ({
    page: setupPage,
    context,
  }, testInfo) => {
    test.setTimeout(180_000);
    await setupPage.request.post("/api/demo/reset");
    await setupPage.goto("/inbox/proposal-approval");
    await setupPage
      .getByRole("button", { name: "Prepare reply", exact: true })
      .click();
    await expect(
      setupPage.getByRole("button", { name: "Copy reply", exact: true }),
    ).toBeVisible();
    for (const [name, path] of routes) {
      // Independent route loads avoid cancelling the prior document's Next.js
      // prefetches. User-driven navigation is exercised in the journey tests.
      const page = await context.newPage();
      const runtimeErrors: string[] = [];
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      await page.setViewportSize({ width: width!, height: height! });
      await page.emulateMedia({ reducedMotion: "reduce" });
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
      if (name === "landing") {
        await expect(page.locator(".preview-image img")).toHaveJSProperty(
          "complete",
          true,
        );
        expect(
          await page
            .locator(".preview-image img")
            .evaluate((image) => (image as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0);
      }
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
      expect(runtimeErrors, `${name} browser errors`).toEqual([]);
      await page.close();
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

import { expect, test } from "@playwright/test";

test("judge can complete the critical demo flow", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("link", { name: "Open demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Inbox focus" }),
  ).toBeVisible();
  const dashboardResponse = await page.request.get(
    "/api/dashboard?timezone=UTC",
  );
  expect(dashboardResponse.ok()).toBe(true);
  const dashboard = (await dashboardResponse.json()).data;
  expect(dashboard).toMatchObject({
    demoMode: true,
    gmail: { connected: true, readOnly: true },
    overview: { threads: 12 },
    inboxHealth: { label: "attention" },
  });
  expect(dashboard.today.items[0].type).toBe("task");
  expect(dashboard.priorityThreads[0].threadId).toBe("proposal-approval");
  expect(dashboard.analytics.weeklyThreads).toHaveLength(7);
  expect(dashboard.replies.recentDrafts[0]).toMatchObject({
    copyOnly: true,
    sent: false,
  });
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: "Inbox", exact: true })
    .click();
  await page.locator('a[href="/inbox/proposal-approval"]').first().click();
  await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();
  await page.getByRole("button", { name: "Generate draft" }).click();
  await expect(page.getByText("Copy only")).toBeVisible();
  await expect(
    page.getByText("Re: Approval needed: Aurora proposal"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy reply" }).click();
  await expect(
    page.getByRole("button", { name: "Copied to clipboard" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  const draftListResponse = await page.request.get("/api/replies");
  expect(draftListResponse.ok()).toBe(true);
  const draftList = await draftListResponse.json();
  expect(draftList.data.drafts).toHaveLength(1);
  expect(draftList.data.drafts[0]).toMatchObject({
    copyOnly: true,
    sent: false,
  });
  const draftId = String(draftList.data.drafts[0].id);
  const draftDetailResponse = await page.request.get(
    `/api/replies/${encodeURIComponent(draftId)}`,
  );
  expect(draftDetailResponse.ok()).toBe(true);
  expect((await draftDetailResponse.json()).data.id).toBe(draftId);
  const deleteDraftResponse = await page.request.delete(
    `/api/replies/${encodeURIComponent(draftId)}`,
  );
  expect(deleteDraftResponse.ok()).toBe(true);
  expect((await deleteDraftResponse.json()).data.deleted).toBe(true);
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: "Tasks", exact: true })
    .click();
  await page.getByLabel("Task title").fill("Prepare judging notes");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Prepare judging notes")).toBeVisible();
  await page
    .getByRole("button", { name: "Complete Prepare judging notes" })
    .click();
  await expect(
    page.getByRole("button", { name: "Reopen Prepare judging notes" }),
  ).toBeVisible();
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: "Insights", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("status")).toContainText("Demo restored");
  await page.getByRole("button", { name: "Exit demo" }).click();
  await expect(
    page.getByRole("heading", { name: /Noise becomes signal/i }),
  ).toBeVisible();
});

test("dashboard shell remains usable at release viewports", async ({
  page,
}) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];

  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Inbox focus" }),
    ).toBeVisible();
    if (viewport.width >= 821) {
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).toBeHidden();
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(
      overflow,
      `${viewport.width}x${viewport.height} overflow`,
    ).toBeLessThanOrEqual(0);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("complementary", { name: "Primary navigation" }),
  ).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

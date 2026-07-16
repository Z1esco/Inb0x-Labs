import { expect, test } from "@playwright/test";

test("judge can complete the critical demo flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Today’s inbox focus" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Inbox", exact: true }).click();
  await page
    .getByRole("link", { name: "Approval needed: Aurora proposal" })
    .click();
  await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();
  await page.getByRole("button", { name: "Generate demo draft" }).click();
  await expect(
    page.getByText("Draft only—Inb0x cannot send email."),
  ).toBeVisible();
  await expect(
    page.getByText("Re: Approval needed: Aurora proposal"),
  ).toBeVisible();
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
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.getByLabel("Task title").fill("Prepare judging notes");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Prepare judging notes")).toBeVisible();
  await page.getByRole("link", { name: "Insights" }).click();
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("status")).toHaveText("Demo data reset.");
});

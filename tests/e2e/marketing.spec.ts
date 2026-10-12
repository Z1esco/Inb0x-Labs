import { expect, test } from "@playwright/test";

test("product previews and evidence walkthrough teach without provider calls", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD")
      mutations.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Make room for what needs you",
  );
  await expect(
    page.getByRole("img", {
      name: "Inb0x briefing in a fictional demo workspace",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Thread analysis", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Thread analysis", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("img", {
      name: "Inb0x thread analysis in a fictional demo workspace",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reply Studio", exact: true }).click();
  await expect(
    page.getByRole("img", {
      name: "Inb0x reply review in a fictional demo workspace",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "See the evidence", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Email to action example" }),
  ).toContainText("Verify the date");
  await page
    .getByRole("button", { name: "Choose the next step", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Email to action example" }),
  ).toContainText("A suggestion until you accept");
  await expect(
    page.getByRole("link", { name: "Try task acceptance in the demo" }),
  ).toHaveAttribute("href", "/inbox/proposal-approval");
  expect(mutations).toEqual([]);
  await page
    .getByRole("link", { name: "Open the demo", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("mobile marketing navigation is keyboard reachable and closes on Escape and navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.locator(".site-menu-toggle");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(
    page
      .getByRole("navigation", { name: "Site navigation" })
      .getByRole("link", { name: "Product", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Site navigation" })
    .getByRole("link", { name: "How it works", exact: true })
    .click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#method$/);
  await expect(page.locator("#method")).toBeInViewport();
});

test("reply tones stay local and closed mobile navigation cannot take focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) requests.push(request.url());
  });
  await page.goto("/");
  const menu = page.getByRole("navigation", {
    name: "Site navigation",
    includeHidden: true,
  });
  await expect(menu).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Warm", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Thanks for putting this together",
  );
  await page.getByRole("button", { name: "Direct", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "I’ll review the proposal",
  );
  await expect(page.getByText("Nothing sent", { exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Open site navigation" }).click();
  await expect(menu).not.toHaveAttribute("inert", "");
  await page.locator(".hero-letter").click();
  await expect(menu).toHaveAttribute("inert", "");
});

test("reduced motion disables marketing movement and content works without JavaScript", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Warm", exact: true }).click();
  expect(
    await page
      .locator(".reply-wording blockquote")
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await context.newPage();
  await staticPage.goto("/");
  await expect(staticPage.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    staticPage.getByRole("link", { name: "Open the demo", exact: true }).last(),
  ).toBeVisible();
  await context.close();
});

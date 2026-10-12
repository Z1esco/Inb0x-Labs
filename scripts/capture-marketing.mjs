import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";

const label = process.argv[2] || "after";
const base = process.argv[3] || "http://127.0.0.1:3100";
const directory = `docs/screenshots/premium-${label}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const [width, height] of [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${directory}/landing-${width}.png`,
    fullPage: true,
  });
  await page.screenshot({ path: `${directory}/hero-${width}.png` });
  const result = {
    width,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    errors,
  };
  results.push(result);
  console.log(JSON.stringify(result));
  await page.close();
}
if (label === "after") {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Thread analysis", exact: true })
    .click();
  await page
    .locator(".site-product")
    .screenshot({ path: `${directory}/product-analysis.png` });
  await page
    .getByRole("button", { name: "Choose the next step", exact: true })
    .click();
  await page
    .locator(".site-method")
    .screenshot({ path: `${directory}/walkthrough-decision.png` });
  await page.getByRole("button", { name: "Warm", exact: true }).click();
  await page
    .locator(".site-reply")
    .screenshot({ path: `${directory}/reply-warm.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole("button", { name: "Open site navigation" }).click();
  await page.screenshot({ path: `${directory}/mobile-navigation.png` });
  await page.close();
}
await writeFile(
  `${directory}/viewport-results.json`,
  JSON.stringify(results, null, 2) + "\n",
);
await browser.close();

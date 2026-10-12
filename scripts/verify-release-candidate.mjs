import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] || "http://127.0.0.1:3100";
const label = process.argv[3] || "candidate";
if (!/^[a-z-]+$/.test(label)) throw new Error("Invalid artifact label");
const origin = new URL(base).origin;
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: "reduce" });
const attemptedMutations = [];
await context.route("**/*", (route) => {
  const request = route.request();
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
    attemptedMutations.push(new URL(request.url()).pathname);
    return route.abort();
  }
  return route.continue();
});
try {
  const response = await context.request.get(`${origin}/api/health`);
  const health = await response.json();
  if (!health.success || health.data.demoMode !== true)
    throw new Error(
      "Read-only demo smoke requires an explicitly fictional deployment",
    );
  const directory = `docs/screenshots/stabilization-${label}`;
  await mkdir(directory, { recursive: true });
  const results = [];
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    for (const [name, path] of [
      ["home", "/"],
      ["login", "/login"],
      ["dashboard", "/dashboard"],
      ["thread", "/inbox/proposal-approval"],
    ]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        window.__lab = { lcp: 0, cls: 0 };
        new PerformanceObserver((list) => {
          for (const item of list.getEntries())
            window.__lab.lcp = item.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const item of list.getEntries())
            if (!item.hadRecentInput) window.__lab.cls += item.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      const loaded = await page.goto(`${origin}${path}`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
      if (name === "home" || name === "dashboard")
        await page.screenshot({
          path: `${directory}/${name}-${width}.png`,
          fullPage: true,
        });
      const metrics = await page.evaluate(() => ({
        navigationMs: Math.round(
          performance.getEntriesByType("navigation")[0].duration,
        ),
        lcpMs: Math.round(window.__lab.lcp),
        cls: window.__lab.cls,
        overflow: document.documentElement.scrollWidth > innerWidth,
        heading: document.querySelector("h1")?.textContent,
        measuredResourceBytes: performance
          .getEntriesByType("resource")
          .reduce((sum, item) => sum + item.encodedBodySize, 0),
      }));
      const result = {
        route: path,
        width,
        status: loaded.status(),
        ...metrics,
        errors,
      };
      results.push(result);
      console.log(JSON.stringify(result));
      await page.close();
    }
  }
  if (attemptedMutations.length)
    throw new Error("Read-only smoke attempted a mutation");
  await writeFile(
    `${directory}/lab-results.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        base: origin,
        mode: "Read-only fictional demo; single lab samples, not field Web Vitals",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  if (
    results.some(
      (result) =>
        result.status !== 200 || result.overflow || result.errors.length,
    )
  )
    throw new Error(
      "Read-only smoke found failures; see saved lab-results.json",
    );
} finally {
  await context.close();
  await browser.close();
}

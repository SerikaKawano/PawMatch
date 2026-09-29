/* eslint-disable @typescript-eslint/no-require-imports -- Playwright capture utility runs directly under CommonJS Node. */
const path = require("node:path");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");

const baseUrl = process.env.PAWMATCH_SCREENSHOT_URL || "http://127.0.0.1:3002";
const outputDirectory = path.resolve(__dirname, "..", "docs", "reports", "figures");

async function login(context, userId) {
  const response = await context.request.post(`${baseUrl}/api/demo-session`, {
    data: { userId },
    headers: { Origin: baseUrl },
  });
  if (!response.ok()) throw new Error(`Login failed for ${userId}: ${response.status()}`);
}

async function capture(browser, userId, route, filename, waitForText) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: "en-GB",
  });
  await login(context, userId);
  const page = await context.newPage();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.locator("body").waitFor();
  if (waitForText) await page.getByText(waitForText, { exact: false }).first().waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(750);
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage: false });
  await context.close();
}

(async () => {
  await fs.mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PAWMATCH_BROWSER_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  });
  try {
    await capture(browser, "reviewer", "/reviews/progress", "review-progress-board-en.png", "審査進捗ボード");
    await capture(browser, "reviewer", "/reviews/app-aiko", "review-case-en.png", "適合性確認");
    await capture(browser, "admin", "/research/setup", "research-setup-en.png", "審査項目と重みの設定");
  } finally {
    await browser.close();
  }
  console.log(`Captured report screenshots in ${outputDirectory}`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const stylesheets = [
  "globals.css", "global-theme.css", "navigation.css", "roles.css", "session.css", "research/research.css",
];

test("visible text declarations stay at or above the 17px reading floor", () => {
  const app = join(__dirname, "..", "app");
  const globals = readFileSync(join(app, "globals.css"), "utf8");
  assert.match(globals, /:root\s*\{[^}]*font-size\s*:\s*17px/);
  const theme = readFileSync(join(app, "global-theme.css"), "utf8");
  assert.match(theme, /small\s*\{\s*font-size\s*:\s*17px/);
  for (const stylesheet of stylesheets) {
    const css = readFileSync(join(app, stylesheet), "utf8");
    for (const match of css.matchAll(/font-size\s*:\s*(\d+)px/g)) {
      const size = Number(match[1]);
      assert.ok(size === 0 || size >= 17, `${stylesheet} has font-size ${size}px`);
    }
  }
});

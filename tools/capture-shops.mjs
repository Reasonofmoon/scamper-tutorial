// Regenerates img/shop-<id>.png and data/json/<id>.json from data/businesses.js
// by driving the real Thinking Matrix page.
//
// Usage (run from anywhere; set ROOT below to your local folder first):
//   ego-browser nodejs < /absolute/path/to/scamper-tutorial/tools/capture-shops.mjs
//
// Set ONLY to a list of ids (e.g. ["academy"]) to capture just those businesses; [] = all.
const ROOT = "/ABSOLUTE/PATH/TO/scamper-tutorial/"; // <- set to your local folder (keep the trailing slash)
const ONLY = [];
const SITE = "https://devlog.moonlang.com/scamper-matrix/";

const fs = await import("node:fs/promises");
await fs.mkdir(ROOT + "data/json", { recursive: true });

// businesses.js assigns window.BUSINESSES; evaluate it in an isolated scope.
const src = await fs.readFile(ROOT + "data/businesses.js", "utf8");
const win = {};
new Function("window", src)(win);
const targets = win.BUSINESSES.filter((b) => ONLY.length === 0 || ONLY.includes(b.id));

const task = await taskSpace("scamper tutorial capture");
const page = task.page("p1");

for (const b of targets) {
  const payload = {
    topic: `${b.label} '${b.shop}' — ${b.goal}`,
    framework: { preset: "scamper" },
    ideas: b.ideas.map(([cat, title, desc, y, x]) => ({ title, desc, cat, y, x })),
  };
  await fs.writeFile(ROOT + `data/json/${b.id}.json`, JSON.stringify(payload, null, 2));

  // Fresh page each time so earlier boards never leak into the screenshot.
  await page.goto(SITE);
  await page.waitForLoadState();
  await page.click("text=⇄ JSON 입출력");
  await page.fill("#ioText", JSON.stringify(payload));
  await page.click("text=불러오기");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: ROOT + `img/shop-${b.id}.png`, fullPage: true });
  const stats = await page.evaluate(() => ({
    coverage: document.body.innerText.match(/커버리지\n[^\n]*/)?.[0] ?? "?",
    inbox: document.body.innerText.match(/미분류 인박스 \((\d+)\)/)?.[1] ?? "0",
  }));
  console.log(b.id, b.ideas.length, "ideas |", stats.coverage.replace("\n", " "), "| inbox", stats.inbox);
}

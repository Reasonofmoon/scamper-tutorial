// Regenerates the phone-width images in img/m/ by driving the real Thinking Matrix page
// with a 390px mobile viewport (the site reflows to one column, so text stays readable).
//   img/m/shop-<id>.png          one per business in data/businesses.js
//   img/m/<scene>.png            tutorial scenes (placed, full, impact, eisenhower, sixhats, edit dialog, json)
//
// Usage: set ROOT to your local folder, then
//   ego-browser nodejs < /absolute/path/to/scamper-tutorial/tools/capture-mobile.mjs
//
// ONLY: ids of businesses to capture ([] = all). SCENES: false skips the tutorial scenes.
const ROOT = "/ABSOLUTE/PATH/TO/scamper-tutorial/"; // <- set to your local folder (keep the trailing slash)
const ONLY = [];
const SCENES = true;
const SITE = "https://devlog.moonlang.com/scamper-matrix/";

const fs = await import("node:fs/promises");
const OUT = ROOT + "img/m/";
await fs.mkdir(OUT, { recursive: true });

const src = await fs.readFile(ROOT + "data/businesses.js", "utf8");
const win = {};
new Function("window", src)(win);
const shops = win.BUSINESSES.filter((b) => ONLY.length === 0 || ONLY.includes(b.id));

const task = await taskSpace("scamper tutorial capture");
const page = await task.newPage();
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

const open = async () => {
  await page.goto(SITE);
  await page.waitForLoadState();
};
const importJson = async (payload) => {
  await page.click("text=⇄ JSON 입출력");
  await page.fill("#ioText", JSON.stringify(payload));
  await page.click("text=불러오기");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
};
const full = (name) => page.screenshot({ path: OUT + name + ".png", fullPage: true });

for (const b of shops) {
  await open();
  await importJson({
    topic: `${b.label} '${b.shop}' — ${b.goal}`,
    framework: { preset: "scamper" },
    ideas: b.ideas.map(([cat, title, desc, y, x]) => ({ title, desc, cat, y, x })),
  });
  await full("shop-" + b.id);
  console.log("shop", b.id);
}

if (SCENES) {
  const cafe = JSON.parse(await fs.readFile(ROOT + "data/json/cafe.json", "utf8"));
  const lines = cafe.ideas.map((i) => `${i.title} | ${i.desc} | ${i.y} | ${i.x}`);

  // 1) keyword auto-placement (some cards land in the wrong cell on purpose of the story)
  await open();
  await importJson({ topic: cafe.topic, framework: { preset: "scamper" }, ideas: [] });
  await page.fill("#quickInput", lines.join("\n"));
  await page.click("text=▶ 매트릭스에 자동 배치");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await full("03-placed");

  // 2) edit dialog on the inbox card
  await page.click("text=저녁에는 칵테일 바로 역전");
  await page.waitForTimeout(400);
  await page.selectOption("dialog[open] select", { label: "역전·재배열" });
  await page.screenshot({ path: OUT + "05b-edit-dialog.png" });
  await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close()));

  // 3) final cafe board + other frameworks
  await importJson(cafe);
  await full("06-full");
  for (const [value, name] of [["impact", "07-impact"], ["eisenhower", "08-eisenhower"], ["sixhats", "08b-sixhats"]]) {
    await page.selectOption("select", value);
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await full(name);
  }
  await page.selectOption("select", "scamper");
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));

  // 4) JSON dialog
  await page.click("text=⇄ JSON 입출력");
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + "10-json.png" });
  await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close()));
  console.log("scenes done");
}
await page.close();

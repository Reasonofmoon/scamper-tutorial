// Builds one static page per business (b/<id>/index.html), a hub page (b/index.html)
// and sitemap.xml from data/businesses.js. No dependencies.
//
//   node tools/build-pages.mjs
//
// Run it again whenever data/businesses.js changes, then commit the generated files.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://devlog.moonlang.com/scamper-tutorial/";
const TOOL_URL = "https://devlog.moonlang.com/scamper-matrix/";
const PRIORITY_MIN = 4; // both effect and feasibility >= 4 means "우선 실행"

const LENSES = [
  { key: "s", ko: "대체", en: "Substitute", q: "무엇을 바꿔치울까?" },
  { key: "c", ko: "결합", en: "Combine", q: "무엇과 합칠까?" },
  { key: "a", ko: "응용", en: "Adapt", q: "무엇을 응용·차용할까?" },
  { key: "m", ko: "수정·확대", en: "Modify/Magnify", q: "바꾸거나 키우면?" },
  { key: "p", ko: "전용", en: "Put to other use", q: "다른 쓰임새는?" },
  { key: "e", ko: "제거·축소", en: "Eliminate", q: "무엇을 뺄까?" },
  { key: "r", ko: "역전·재배열", en: "Reverse/Rearrange", q: "뒤집거나 재배열하면?" },
];

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function loadData() {
  const source = await readFile(path.join(ROOT, "data/businesses.js"), "utf8");
  const win = {};
  new Function("window", source)(win);
  const businesses = win.BUSINESSES ?? [];
  const known = new Set((win.BUSINESS_GROUPS ?? []).map((g) => g.id));
  const groups = [...(win.BUSINESS_GROUPS ?? [])];
  const groupOf = (b) => (known.has(b.group) ? b.group : "etc");
  if (businesses.some((b) => groupOf(b) === "etc")) groups.push({ id: "etc", emoji: "📦", label: "기타" });
  return { businesses, groups: groups.filter((g) => businesses.some((b) => groupOf(b) === g.id)), groupOf };
}

function head({ title, description, url, image, base }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%2780%27 font-size=%2780%27%3E%F0%9F%92%A1%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="${base}assets/page.css">
</head>`;
}

const footer = `<footer class="foot"><div class="wrap">화면은 <a href="${TOOL_URL}" target="_blank" rel="noopener">씽킹 매트릭스</a>(『사고법 도감』 기반)를 직접 조작해 캡처한 것이며, 가게 이름과 모든 점수는 설명용 가상 예시입니다. 실제 성과나 효과를 보장하지 않습니다.</div></footer>`;

function ideaCard([, title, desc, effect, feasibility]) {
  const isPriority = effect >= PRIORITY_MIN && feasibility >= PRIORITY_MIN;
  return `<li class="idea${isPriority ? " pri" : ""}">
        <div><strong>${esc(title)}</strong><span>${esc(desc)}</span></div>
        <em title="효과 ${effect} · 실현성 ${feasibility}">${isPriority ? "⭐ " : ""}효과 ${effect} · 실현 ${feasibility}</em>
      </li>`;
}

function lensSection(lens, ideas) {
  const rows = ideas.filter(([key]) => key === lens.key);
  const body = rows.length
    ? `<ul class="ideas">${rows.map(ideaCard).join("\n      ")}</ul>`
    : `<p class="empty">💡 빈 칸 — 다음 발상 지점. “${esc(lens.q)}”로 하나 더 떠올려보세요.</p>`;
  return `<section class="lens"><h3><b>${esc(lens.ko)}</b><small>${esc(lens.en)}</small><span>${rows.length}</span></h3>
      <p class="q">${esc(lens.q)}</p>
      ${body}
    </section>`;
}

function businessPage(b, ctx) {
  const { groups, groupOf, businesses } = ctx;
  const group = groups.find((g) => g.id === groupOf(b));
  const peers = businesses.filter((x) => groupOf(x) === groupOf(b) && x.id !== b.id);
  const priority = b.ideas.filter(([, , , e, f]) => e >= PRIORITY_MIN && f >= PRIORITY_MIN);
  const url = `${SITE_URL}b/${b.id}/`;
  const title = `${b.label} 사장님을 위한 SCAMPER 아이디어 ${b.ideas.length}개 — ‘${b.shop}’ 가상 사례`;
  const description = `${b.label} ‘${b.shop}’(가상 사례)가 SCAMPER 7가지 질문으로 “${b.goal}” 아이디어 ${b.ideas.length}개를 정리한 과정과 우선순위.`;
  return `${head({ title, description, url, image: `${SITE_URL}img/shop-${b.id}.png`, base: "../../" })}
<body>
<header class="top"><div class="wrap">
  <nav class="crumbs" aria-label="경로"><a href="../../">튜토리얼</a> <span>›</span> <a href="../">업종별</a> <span>›</span> ${esc(group?.label ?? "")} <span>›</span> <b>${esc(b.label)}</b></nav>
</div></header>

<main class="wrap">
  <p class="tag">가상 사례 · ${esc(group?.emoji ?? "")} ${esc(group?.label ?? "")}</p>
  <h1>${esc(b.emoji)} ‘${esc(b.shop)}’ <small>${esc(b.label)}</small></h1>
  <p class="lead">목표: <b>${esc(b.goal)}</b> — SCAMPER 7가지 질문으로 아이디어 ${b.ideas.length}개를 정리했습니다.</p>

  <section>
    <h2>핵심 3가지</h2>
    <div class="pick">
      ${b.picks.map(([l, t]) => `<div><b>${esc(l)}</b> ${esc(t)}</div>`).join("\n      ")}
    </div>
  </section>

  <section>
    <h2>완성 보드</h2>
    <figure class="shot">
      <a href="../../img/shop-${esc(b.id)}.png" target="_blank" rel="noopener"><picture><source media="(max-width:760px)" srcset="../../img/m/shop-${esc(b.id)}.png"><img src="../../img/shop-${esc(b.id)}.png" alt="${esc(b.label)} SCAMPER 보드" width="1387" loading="lazy"></picture></a>
      <figcaption>실제 씽킹 매트릭스 화면 · 누르면 크게 열립니다 · 모든 칸이 채워진 7/7 보드</figcaption>
    </figure>
  </section>

  <section>
    <h2>렌즈별 아이디어</h2>
    <p class="hint">효과·실현성은 1~5점의 예시 점수입니다. ⭐는 둘 다 ${PRIORITY_MIN}점 이상 — “우선 실행” 후보.</p>
    <div class="lenses">
    ${LENSES.map((l) => lensSection(l, b.ideas)).join("\n    ")}
    </div>
  </section>

  <section>
    <h2>먼저 시작하기 좋은 것 <small>(${priority.length}개)</small></h2>
    ${
      priority.length
        ? `<ol class="start">${priority.map(([k, t, d]) => `<li><b>${esc(LENSES.find((l) => l.key === k)?.ko ?? k)}</b> ${esc(t)} <span>— ${esc(d)}</span></li>`).join("")}</ol>`
        : `<p class="empty">효과·실현성이 모두 ${PRIORITY_MIN}점 이상인 아이디어가 아직 없습니다.</p>`
    }
  </section>

  <section class="try">
    <h2>내 가게로 바꿔서 해보기 <small>3단계 · 약 2분</small></h2>
    <ol class="doit">
      <li><span class="n">1</span><div><b>보드를 복사합니다</b><p class="actions"><button type="button" id="copy" class="go" data-src="../../data/json/${esc(b.id)}.json">📋 예시 보드 복사</button><a class="btn alt" href="../../data/json/${esc(b.id)}.json" download="scamper-${esc(b.id)}.json">복사가 안 되면 내려받기</a></p></div></li>
      <li><span class="n">2</span><div><b>씽킹 매트릭스를 엽니다</b><p class="actions"><a class="btn" href="${TOOL_URL}" target="_blank" rel="noopener">▶ 매트릭스 열기 ↗</a></p></div></li>
      <li><span class="n">3</span><div><b>붙여넣고 불러옵니다</b><p>열린 화면에서 <b>⇄ JSON 입출력</b> → 붙여넣기(Ctrl/⌘+V) → <b>불러오기</b>. 그다음 가게 이름과 아이디어를 내 것으로 고치면 끝!</p></div></li>
    </ol>
    <p id="copyMsg" class="hint" role="status" aria-live="polite"></p>
    <p class="hint">처음이라 낯설다면 <a href="../../#start">3분 체험 안내</a>에서 그림과 함께 따라 해보세요.</p>
  </section>

  ${
    peers.length
      ? `<section><h2>${esc(group?.label ?? "")}의 다른 업종</h2><div class="chips">${peers.map((p) => `<a href="../${esc(p.id)}/">${esc(p.emoji)} ${esc(p.label)}</a>`).join("")}</div></section>`
      : ""
  }
  <p class="back"><a href="../">← 전체 업종 보기</a> · <a href="../../">튜토리얼 처음으로</a></p>
</main>
${footer}
<script>
// Prefetch the JSON so the click handler can copy synchronously (browsers drop the
// user-gesture permission after an await, which makes clipboard writes fail).
const copyBtn = document.getElementById("copy");
const copyMsg = document.getElementById("copyMsg");
let boardText = "";
fetch(copyBtn.dataset.src).then((r) => r.text()).then((t) => { boardText = t; }).catch(() => {});

function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  return ok;
}

copyBtn.addEventListener("click", async () => {
  let ok = false;
  if (boardText) {
    ok = legacyCopy(boardText);
    if (!ok) {
      try { await navigator.clipboard.writeText(boardText); ok = true; } catch (err) { ok = false; }
    }
  }
  copyMsg.textContent = ok
    ? "✅ 복사했습니다! 2단계로 가서 매트릭스를 열고, ⇄ JSON 입출력 창에 붙여넣으세요."
    : "복사에 실패했습니다. ‘복사가 안 되면 내려받기’를 눌러 파일을 받은 뒤, 내용을 열어 붙여넣어주세요.";
  if (ok) copyBtn.classList.remove("go");
});
</script>
</body>
</html>
`;
}

function hubPage(ctx) {
  const { groups, groupOf, businesses } = ctx;
  const title = `업종별 SCAMPER 아이디어 ${businesses.length}종 — 사장님을 위한 SCAMPER 매트릭스`;
  const description = `카페·꽃집·학원·약국 등 ${businesses.length}개 업종(가상 사례)에 SCAMPER 7가지 질문을 적용한 아이디어와 보드 모음.`;
  const sections = groups
    .map((g) => {
      const items = businesses.filter((b) => groupOf(b) === g.id);
      return `<section><h2>${esc(g.emoji)} ${esc(g.label)} <small>${items.length}</small></h2>
    <div class="cards">${items
      .map(
        (b) => `<a class="biz" href="${esc(b.id)}/"><span class="em">${esc(b.emoji)}</span><b>${esc(b.label)}</b><i>‘${esc(b.shop)}’</i><small>${esc(b.goal)}</small><em>아이디어 ${b.ideas.length}개</em></a>`,
      )
      .join("")}</div></section>`;
    })
    .join("\n  ");
  return `${head({ title, description, url: `${SITE_URL}b/`, image: `${SITE_URL}img/og.png`, base: "../" })}
<body>
<header class="top"><div class="wrap"><nav class="crumbs"><a href="../">튜토리얼</a> <span>›</span> <b>업종별</b></nav></div></header>
<main class="wrap">
  <p class="tag">가상 사례 ${businesses.length}종</p>
  <h1>업종별 SCAMPER 아이디어</h1>
  <p class="lead">같은 7가지 질문을 가게만 바꿔서 적용했습니다. 업종을 눌러 전용 페이지에서 보드와 아이디어, 바로 불러올 수 있는 JSON을 확인하세요.</p>
  ${sections}
</main>
${footer}
</body>
</html>
`;
}

const ctx = await loadData();
for (const b of ctx.businesses) {
  const dir = path.join(ROOT, "b", b.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), businessPage(b, ctx));
}
await writeFile(path.join(ROOT, "b/index.html"), hubPage(ctx));

const urls = [SITE_URL, `${SITE_URL}b/`, ...ctx.businesses.map((b) => `${SITE_URL}b/${b.id}/`)];
await writeFile(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`,
);
console.log(`built ${ctx.businesses.length} business pages + hub + sitemap`);

#!/usr/bin/env node
// ============================================
// PORCUBE サイトビルド
//   node tools/build.js
//
// js/data.js の内容をもとに、
//   1. index.html の作品・イベント・メンバー欄に HTML を書き込む（検索エンジン向け）
//   2. 作品ごとのページ games/<slug>.html を生成する
//   3. sitemap.xml を生成する
// data.js を編集したら実行して、生成されたファイルもコミットしてください。
// ============================================
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const R = require("../js/render.js");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://porcube.github.io/";
const esc = R.esc;

// ---- data.js を読み込む ----
function loadData() {
  const code = fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8");
  return vm.runInNewContext(code + "\n;({ SITE, GAMES, EVENTS, MEMBERS })", {});
}

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (prev === content) return console.log("  変更なし  " + rel);
  fs.writeFileSync(file, content);
  console.log("  更新      " + rel);
}

// ---- 1. index.html ----
function buildIndex(data) {
  const rel = "index.html";
  let html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const events = R.eventLists(data.EVENTS, new Date());
  const blocks = {
    "games": R.gamesGrid(data.GAMES),
    "events-upcoming": events.upcoming,
    "events-past": events.past,
    "members": R.membersList(data.MEMBERS),
  };
  for (const [name, body] of Object.entries(blocks)) {
    const re = new RegExp("(<!-- build:" + name + " -->)[\\s\\S]*?(<!-- /build:" + name + " -->)");
    if (!re.test(html)) throw new Error("index.html に <!-- build:" + name + " --> がありません");
    html = html.replace(re, (_, a, b) => a + body + b);
  }
  write(rel, html);
}

// ---- 2. 作品ページ ----
function playersRange(s) {
  const n = String(s || "").match(/\d+/g);
  if (!n) return null;
  return { "@type": "QuantitativeValue", minValue: Number(n[0]), maxValue: Number(n[n.length - 1]) };
}

function relatedEvents(g, events) {
  return events
    .filter((ev) => [ev.name, ev.note].join(" ").includes(g.title))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

function gamePage(g, data) {
  const B = "../";
  const url = SITE_URL + R.gamePath(g);
  const nameWithKana = g.kana ? g.title + "（" + g.kana + "）" : g.title;
  const pageTitle = nameWithKana + "｜" + (g.players ? g.players + "の" : "") + "ボードゲーム｜PORCUBE";
  const specText = [g.players && "プレイ人数" + g.players, g.time && "プレイ時間" + g.time, g.age && "対象年齢" + g.age]
    .filter(Boolean).join("・");
  const description = g.desc + (specText ? "（" + specText + "）" : "") +
    " ボードゲーム制作サークルPORCUBE（ぽるきゅーぶ）の作品です。";
  const image = g.image ? SITE_URL + g.image : SITE_URL + "assets/logo.png";

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Game",
      name: g.title,
      alternateName: g.kana || undefined,
      description: g.desc,
      url: url,
      image: image,
      numberOfPlayers: playersRange(g.players) || undefined,
      typicalAgeRange: g.age ? g.age.replace(/[^\d]/g, "") + "-" : undefined,
      author: (g.credits || []).filter((c) => c.label === "ゲームデザイン")
        .map((c) => ({ "@type": "Person", name: c.name })),
      publisher: { "@type": "Organization", name: "PORCUBE", alternateName: ["ぽるきゅーぶ", "ポルキューブ"], url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "PORCUBE", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "作品ギャラリー", item: SITE_URL + "#games" },
        { "@type": "ListItem", position: 3, name: g.title, item: url },
      ],
    },
  ];

  const credit = R.videoCredit(g.videoCredit);
  const evs = relatedEvents(g, data.EVENTS);
  const others = data.GAMES.filter((o) => o !== g && o.slug);
  const links = R.externalLinks(g, B);

  const sections = [];

  if (g.about && g.about.length) {
    sections.push(section("ゲーム紹介", "About",
      '<div class="detail-prose">' + g.about.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>"));
  }
  if (g.howto && g.howto.length) {
    sections.push(section("遊び方", "How to play",
      '<ol class="howto-list">' + g.howto.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ol>" +
      (g.goal ? '<p class="howto-goal">' + esc(g.goal) + "</p>" : "") +
      '<p class="detail-note">くわしいルールは説明書（PDF）をご覧ください。ルールの疑問は' +
      '<a href="' + B + 'errata.html">エラッタ・よくある質問</a>にまとめています。</p>'));
  }
  if (g.video) {
    sections.push(section("動画", "Movie",
      '<video class="detail-video" controls playsinline preload="none"' +
      (g.image ? ' poster="' + esc(B + g.image) + '"' : "") + ' src="' + esc(B + g.video) + '"></video>' +
      (credit ? '<p class="detail-video-credit">' + credit + "</p>" : "")));
  }
  if ((g.contents && g.contents.length) || (g.credits && g.credits.length)) {
    let body = '<div class="detail-cols">';
    if (g.contents && g.contents.length) {
      body += '<div><h3 class="detail-h3">内容物</h3><ul class="detail-list">' +
        g.contents.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul></div>";
    }
    if (g.credits && g.credits.length) {
      body += '<div><h3 class="detail-h3">クレジット</h3><dl class="detail-credits">' +
        g.credits.map((c) => "<dt>" + esc(c.label) + "</dt><dd>" + esc(c.name) + "</dd>").join("") +
        "<dt>制作</dt><dd>PORCUBE（ぽるきゅーぶ）</dd></dl></div>";
    }
    sections.push(section("内容物・クレジット", "Components", body + "</div>"));
  }
  if (evs.length) {
    sections.push(section("出展・頒布イベント", "Events",
      '<ul class="detail-events">' + evs.map((ev) => {
        const p = R.eventDateParts(ev);
        const name = esc(ev.name) + (ev.booth ? "（" + esc(ev.booth) + "）" : "");
        return "<li><span class=\"detail-events-date\">" + p.ym + "." + p.day + "</span>" +
          (ev.url ? '<a href="' + esc(ev.url) + '" target="_blank" rel="noopener">' + name + "</a>" : name) +
          (ev.place ? '<span class="detail-events-place">' + esc(ev.place) + "</span>" : "") + "</li>";
      }).join("") + "</ul>"));
  }
  if (others.length) {
    sections.push(section("ほかの作品", "Other games",
      '<ul class="other-games">' + others.map((o) =>
        '<li><a href="' + esc(o.slug) + '.html">' +
        (o.image ? '<img src="' + esc(B + o.image) + '" alt="" loading="lazy">' : "") +
        '<span class="other-games-title">' + esc(o.title) + "</span>" +
        '<span class="other-games-desc">' + esc(o.desc) + "</span></a></li>").join("") + "</ul>"));
  }

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="${B}assets/logo.png">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="PORCUBE（ぽるきゅーぶ）">
<meta property="og:title" content="${esc(nameWithKana + "｜PORCUBE")}">
<meta property="og:description" content="${esc(g.desc)}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${B}css/style.css">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-260PDCBPMC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-260PDCBPMC');
</script>
</head>

<body>
<!-- このファイルは tools/build.js で自動生成しています。直接編集せず js/data.js を編集してください。 -->

${header(B)}

<main class="detail">
  <nav class="breadcrumb" aria-label="パンくずリスト">
    <a href="${B}">PORCUBE</a><span aria-hidden="true">›</span><a href="${B}#games">作品ギャラリー</a><span aria-hidden="true">›</span><span aria-current="page">${esc(g.title)}</span>
  </nav>

  <section class="detail-hero">
    <div class="detail-hero-media">
      ${g.image ? `<img src="${esc(B + g.image)}" alt="${esc(g.title)} のパッケージ">` : '<span class="game-thumb--empty">COMING SOON</span>'}
    </div>
    <div class="detail-hero-body">
      ${g.isNew ? '<span class="badge-new">NEW</span>' : ""}
      <h1 class="detail-title">${esc(g.title)}</h1>
      ${g.kana ? `<p class="detail-kana">${esc(g.kana)}</p>` : ""}
      <div class="game-specs">${R.specChips(g)}</div>
      <p class="detail-lead">${esc(g.desc)}</p>
      ${links ? `<div class="game-links">${links}</div>` : ""}
    </div>
  </section>

${sections.join("\n")}

  <p class="detail-back"><a class="btn" href="${B}#games">← 作品ギャラリーへ戻る</a></p>
</main>

${footer(B)}

</body>
</html>
`;
}

function section(title, sub, body) {
  return `  <section class="detail-section">
    <div class="detail-section-head">
      <h2>${esc(title)}</h2>
      <p class="section-sub">${esc(sub)}</p>
    </div>
    ${body}
  </section>`;
}

function header(B) {
  return `<header class="site-header">
  <a class="brand" href="${B}" aria-label="PORCUBE トップへ">
    <span class="brand-die" aria-hidden="true">
      <span class="pip"></span><span class="pip"></span><span class="pip"></span><span class="pip"></span>
    </span>
    <span class="brand-name">PORCUBE</span>
  </a>
  <nav class="site-nav" aria-label="メインナビゲーション">
    <a class="nav-pill" href="${B}#games">Games</a>
    <a class="nav-pill" href="${B}#events">Events</a>
    <a class="nav-pill nav-pill--solid" href="${B}#contact">Contact</a>
  </nav>
</header>`;
}

function footer(B) {
  return `<footer class="site-footer">
  <span>© <span id="year">${new Date().getFullYear()}</span> PORCUBE（ぽるきゅーぶ／ポルキューブ）</span>
  <span class="footer-links">
    <a href="${B}privacy.html">プライバシーポリシー</a>
    <a href="${B}copyright.html">利用規約・著作権</a>
  </span>
  <span class="footer-pips" aria-hidden="true"><span></span><span></span><span></span></span>
</footer>
<script>document.getElementById("year").textContent = new Date().getFullYear();</script>`;
}

// ---- 3. sitemap.xml ----
function buildSitemap(data) {
  const urls = [SITE_URL]
    .concat(data.GAMES.filter((g) => g.slug).map((g) => SITE_URL + R.gamePath(g)))
    .concat([SITE_URL + "errata.html", SITE_URL + "copyright.html"]);
  write("sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => "  <url><loc>" + u + "</loc></url>").join("\n") +
    "\n</urlset>\n");
}

// ---- main ----
const data = loadData();
const slugs = new Set();
for (const g of data.GAMES) {
  if (!g.slug) continue;
  if (!/^[a-z0-9-]+$/.test(g.slug)) throw new Error("slug は半角英小文字・数字・ハイフンのみ: " + g.slug);
  if (slugs.has(g.slug)) throw new Error("slug が重複しています: " + g.slug);
  slugs.add(g.slug);
}

console.log("PORCUBE build");
buildIndex(data);
for (const g of data.GAMES) if (g.slug) write(R.gamePath(g), gamePage(g, data));
buildSitemap(data);
console.log("完了");

// ============================================
// PORCUBE — HTML テンプレート
// ブラウザ（js/app.js）とビルド（tools/build.js）の両方から使います
// ============================================
(function (root) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // 相対パス（assets/xxx など）にだけ base を付ける
  function withBase(url, base) {
    if (!url || !base || /^([a-z]+:|\/\/|\/|#)/i.test(url)) return url;
    return base + url;
  }

  function gamePath(g) {
    return "games/" + g.slug + ".html";
  }

  function specChips(g) {
    return [g.players, g.time, g.age].filter(Boolean).map(function (s) {
      return '<span class="spec-chip">' + esc(s) + "</span>";
    }).join("");
  }

  // 動画クレジット（エスケープ済み HTML を返す）
  function videoCredit(vc) {
    if (!vc) return "";
    return esc(vc.label) + "：" + (vc.url
      ? '<a href="' + esc(vc.url) + '" target="_blank" rel="noopener">' + esc(vc.name) + "</a>"
      : esc(vc.name));
  }

  function externalLinks(g, base) {
    return (g.links || []).map(function (l) {
      return '<a href="' + esc(withBase(l.url, base)) + '" target="_blank" rel="noopener">' + esc(l.label) + " →</a>";
    }).join("");
  }

  // ---- トップページの作品カード ----
  function gameCard(g) {
    var page = g.slug ? gamePath(g) : null;
    var thumb = g.image
      ? '<img src="' + esc(g.image) + '" alt="' + esc(g.title) + ' のパッケージ" loading="lazy">'
      : '<span class="game-thumb--empty">COMING SOON</span>';
    if (page && g.image) thumb = '<a href="' + esc(page) + '" tabindex="-1" aria-hidden="true">' + thumb + "</a>";

    var title = page
      ? '<a class="game-title-link" href="' + esc(page) + '">' + esc(g.title) + "</a>"
      : esc(g.title);
    var credit = videoCredit(g.videoCredit);
    var links = (page ? '<a href="' + esc(page) + '">詳しく見る →</a>' : "") + externalLinks(g);

    return (
      '<article class="game-card reveal">' +
        '<div class="game-thumb">' + thumb + "</div>" +
        '<div class="game-body">' +
          (g.isNew ? '<span class="badge-new">NEW</span>' : "") +
          '<h3 class="game-title">' + title + "</h3>" +
          '<div class="game-specs">' + specChips(g) + "</div>" +
          '<p class="game-desc">' + esc(g.desc) + "</p>" +
          (g.video ? '<button type="button" class="btn btn--solid game-video-btn" data-video="' + esc(g.video) +
                     '" data-title="' + esc(g.title) + '" data-credit="' + esc(credit) + '">▶ 動画を見る</button>' : "") +
          (links ? '<div class="game-links">' + links + "</div>" : "") +
        "</div>" +
      "</article>"
    );
  }

  function gamesGrid(games) {
    return games.map(gameCard).join("");
  }

  // ---- イベント ----
  function parseDate(s) {
    return new Date(s + "T00:00:00");
  }

  function splitEvents(events, today) {
    var t = new Date(today);
    t.setHours(0, 0, 0, 0);
    var upcoming = [];
    var past = [];
    events.forEach(function (ev) {
      // 複数日のイベントは最終日（endDate）まで「これからの予定」に残す
      (parseDate(ev.endDate || ev.date) >= t ? upcoming : past).push(ev);
    });
    upcoming.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    past.sort(function (a, b) { return a.date > b.date ? -1 : 1; });
    return { upcoming: upcoming, past: past };
  }

  function eventDateParts(ev) {
    var d = parseDate(ev.date);
    var ym = d.getFullYear() + "." + (d.getMonth() + 1);
    var day = String(d.getDate());
    if (ev.endDate) {
      var e = parseDate(ev.endDate);
      if (e.getMonth() !== d.getMonth()) ym += "–" + (e.getMonth() + 1);
      day += "–" + e.getDate();
    }
    return { ym: ym, day: day };
  }

  function eventRow(ev) {
    var p = eventDateParts(ev);
    var meta = [];
    if (ev.place) meta.push(esc(ev.place));
    if (ev.note) meta.push(esc(ev.note));

    var inner =
      '<span class="event-date"><span class="ym">' + p.ym + '</span><span class="d">' + p.day + "</span></span>" +
      '<span class="event-info">' +
        '<span class="event-name">' + esc(ev.name) +
          (ev.booth ? '<span class="event-booth">' + esc(ev.booth) + "</span>" : "") +
        "</span><br>" +
        '<span class="event-meta">' + meta.join("<br>") + "</span>" +
      "</span>";

    if (ev.url) {
      return '<li class="reveal"><a class="event-row event-row--link" href="' + esc(ev.url) +
             '" target="_blank" rel="noopener">' + inner +
             '<span class="event-arrow" aria-hidden="true">→</span></a></li>';
    }
    return '<li class="event-row reveal">' + inner + "</li>";
  }

  function eventLists(events, today) {
    var s = splitEvents(events, today);
    return {
      upcoming: s.upcoming.length
        ? s.upcoming.map(eventRow).join("")
        : '<li class="events-empty">次のイベントが決まったらここでお知らせします</li>',
      past: s.past.length
        ? s.past.map(eventRow).join("")
        : '<li class="events-empty">これまでの参加履歴はまだありません</li>',
    };
  }

  // ---- メンバー ----
  function membersList(members) {
    return members.map(function (m) {
      var body = '<span class="member-name">' + esc(m.name) + "</span>" +
                 '<span class="member-role">' + esc(m.role) + "</span>";
      return m.url
        ? '<a class="member-card" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + body + "</a>"
        : '<span class="member-card">' + body + "</span>";
    }).join("");
  }

  var api = {
    esc: esc,
    withBase: withBase,
    gamePath: gamePath,
    specChips: specChips,
    videoCredit: videoCredit,
    externalLinks: externalLinks,
    gamesGrid: gamesGrid,
    splitEvents: splitEvents,
    eventDateParts: eventDateParts,
    eventLists: eventLists,
    membersList: membersList,
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PORCUBE_RENDER = api;
})(this);

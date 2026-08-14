// ============================================
// PORCUBE site — rendering
// ============================================
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---- 作品ギャラリー ----
  function renderGames() {
    var grid = document.getElementById("games-grid");
    if (!grid || typeof GAMES === "undefined") return;

    grid.innerHTML = GAMES.map(function (g) {
      var thumb = g.image
        ? '<div class="game-thumb"><img src="' + esc(g.image) + '" alt="' + esc(g.title) + ' のパッケージ" loading="lazy"></div>'
        : '<div class="game-thumb"><span class="game-thumb--empty">COMING SOON</span></div>';

      var specs = [];
      if (g.players) specs.push('<span class="spec-chip">' + esc(g.players) + "</span>");
      if (g.time) specs.push('<span class="spec-chip">' + esc(g.time) + "</span>");
      if (g.age) specs.push('<span class="spec-chip">' + esc(g.age) + "</span>");

      var links = (g.links || []).map(function (l) {
        return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + " →</a>";
      }).join("");

      return (
        '<article class="game-card reveal">' +
          thumb +
          '<div class="game-body">' +
            (g.isNew ? '<span class="badge-new">NEW</span>' : "") +
            '<h3 class="game-title">' + esc(g.title) + "</h3>" +
            '<div class="game-specs">' + specs.join("") + "</div>" +
            '<p class="game-desc">' + esc(g.desc) + "</p>" +
            (links ? '<div class="game-links">' + links + "</div>" : "") +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  // ---- イベント ----
  function renderEvents() {
    var upcomingEl = document.getElementById("events-upcoming");
    var pastEl = document.getElementById("events-past");
    if (!upcomingEl || !pastEl || typeof EVENTS === "undefined") return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = [];
    var past = [];
    EVENTS.forEach(function (ev) {
      var d = new Date(ev.date + "T00:00:00");
      (d >= today ? upcoming : past).push(ev);
    });
    upcoming.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    past.sort(function (a, b) { return a.date > b.date ? -1 : 1; });

  
    function row(ev) {
      var d = new Date(ev.date + "T00:00:00");
      var ym = d.getFullYear() + "." + (d.getMonth() + 1);
      var day = d.getDate();
      var meta = [];
      if (ev.place) meta.push(esc(ev.place));
      if (ev.note) meta.push(esc(ev.note));

      var inner =
        '<span class="event-date"><span class="ym">' + ym + '</span><span class="d">' + day + "</span></span>" +
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

    upcomingEl.innerHTML = upcoming.length
      ? upcoming.map(row).join("")
      : '<li class="events-empty">次のイベントが決まったらここでお知らせします</li>';
    pastEl.innerHTML = past.length
      ? past.map(row).join("")
      : '<li class="events-empty">これまでの参加履歴はまだありません</li>';
  }

  function renderMembers() {
    var el = document.getElementById("members-list");
    if (!el || typeof MEMBERS === "undefined") return;
    el.innerHTML = MEMBERS.map(function (m) {
      var body = '<span class="member-name">' + esc(m.name) + "</span>" +
                 '<span class="member-role">' + esc(m.role) + "</span>";
      return m.url
        ? '<a class="member-card" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + body + "</a>"
        : '<span class="member-card">' + body + "</span>";
    }).join("");
  }
  
  // ---- リンク差し込み ----
  function applySiteLinks() {
    if (typeof SITE === "undefined") return;
    var f = document.getElementById("contact-form-link");
    var x = document.getElementById("contact-x-link");
    if (f && SITE.contactFormUrl) f.href = SITE.contactFormUrl;
    if (x && SITE.xUrl) x.href = SITE.xUrl;
  }

  // ---- スクロールでふわっと表示 ----
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  try {
    renderGames();
    renderEvents();
    renderMembers();
    applySiteLinks();
  } catch (err) {
    console.error("render error:", err);
  }
  setupReveal();
})();

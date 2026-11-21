// ============================================
// PORCUBE site — rendering
// ============================================
(function () {
  "use strict";

  var R = window.PORCUBE_RENDER;

  // ---- 作品ギャラリー ----
  function renderGames() {
    var grid = document.getElementById("games-grid");
    if (!grid || typeof GAMES === "undefined") return;
    grid.innerHTML = R.gamesGrid(GAMES);
  }

  // ---- 動画ポップアップ ----
  function setupVideoModal() {
    var grid = document.getElementById("games-grid");
    if (!grid || !grid.querySelector(".game-video-btn")) return;

    var dialog = document.createElement("dialog");
    dialog.className = "video-modal";
    dialog.innerHTML =
      '<div class="video-modal-inner">' +
        '<button type="button" class="video-modal-close" aria-label="閉じる">×</button>' +
        '<video class="video-modal-player" controls playsinline preload="none"></video>' +
        '<p class="video-modal-credit"></p>' +
      "</div>";
    document.body.appendChild(dialog);
    var video = dialog.querySelector("video");
    var creditEl = dialog.querySelector(".video-modal-credit");

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".game-video-btn");
      if (!btn) return;
      var src = btn.getAttribute("data-video");
      var title = btn.getAttribute("data-title");
      var credit = btn.getAttribute("data-credit");
      if (video.getAttribute("src") !== src) video.setAttribute("src", src);
      creditEl.innerHTML = credit;  // renderGames でエスケープ済み
      creditEl.hidden = !credit;
      dialog.setAttribute("aria-label", title + " の動画");
      dialog.showModal();
      video.currentTime = 0;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      if (typeof gtag === "function") gtag("event", "video_open", { video_title: title });
    });

    function close() {
      video.pause();
      if (dialog.open) dialog.close();
    }

    // ×ボタン・背景クリック・Escキーで閉じ、再生を止める
    dialog.querySelector(".video-modal-close").addEventListener("click", close);
    dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });
    dialog.addEventListener("close", function () { video.pause(); });
    // 読み込み中に閉じた場合、あとから再生が始まっても止める
    video.addEventListener("playing", function () { if (!dialog.open) video.pause(); });
  }

  // ---- イベント ----
  function renderEvents() {
    var upcomingEl = document.getElementById("events-upcoming");
    var pastEl = document.getElementById("events-past");
    if (!upcomingEl || !pastEl || typeof EVENTS === "undefined") return;
    var lists = R.eventLists(EVENTS, new Date());
    upcomingEl.innerHTML = lists.upcoming;
    pastEl.innerHTML = lists.past;
  }

  // ---- メンバー ----
  function renderMembers() {
    var el = document.getElementById("members-list");
    if (!el || typeof MEMBERS === "undefined") return;
    el.innerHTML = R.membersList(MEMBERS);
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
    setupVideoModal();
    renderEvents();
    renderMembers();
    applySiteLinks();
  } catch (err) {
    console.error("render error:", err);
  }
  setupReveal();
})();

// ============================================
// YouTube の軽量埋め込み
// 最初はサムネイルだけ表示し、クリックされたら再生画面に差し替えます。
// JavaScript が無い環境では、そのまま YouTube へのリンクとして動きます。
// ============================================
(function () {
  "use strict";
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".yt-lite[data-yt]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var id = a.getAttribute("data-yt");
    var f = document.createElement("iframe");
    f.className = "yt-lite-frame";
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
    f.title = a.getAttribute("aria-label") || "YouTube 動画";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.allowFullscreen = true;
    a.replaceWith(f);
    if (typeof gtag === "function") gtag("event", "media_video_play", { video_id: id });
  });
})();

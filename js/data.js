// ============================================
// PORCUBE サイトデータ
// ここを編集するだけで作品・イベント・リンクを更新できます
// ============================================

const SITE = {
  // GoogleフォームのURLに差し替えてください
  contactFormUrl: "https://forms.gle/XXXXXXXXXXXX",
  xUrl: "https://x.com/porcube04",
};

// ---- 作品ギャラリー ----
// image: "assets/xxx.jpg"（画像を assets フォルダに入れてパスを指定。無ければ null）
// isNew: true にすると NEW バッジが付きます
// links: 名前とURLの組を好きなだけ（BOOTH、ゲームマーケット、ルール説明PDFなど）
const GAMES = [
  {
    title: "作品タイトルA",
    players: "2〜4人",
    time: "約30分",
    age: "10歳以上",
    desc: "ここにゲームの紹介文が入ります。どんなゲームか、どこが面白いかをひとこと〜ふたことで。",
    image: null,
    isNew: true,
    links: [
      { label: "BOOTHで見る", url: "#" },
    ],
  },
  {
    title: "作品タイトルB",
    players: "3〜5人",
    time: "約45分",
    age: "10歳以上",
    desc: "ここにゲームの紹介文が入ります。",
    image: null,
    isNew: false,
    links: [],
  },
  {
    title: "作品タイトルC",
    players: "2人",
    time: "約15分",
    age: "8歳以上",
    desc: "ここにゲームの紹介文が入ります。",
    image: null,
    isNew: false,
    links: [],
  },
];

// ---- イベント ----
// date: "YYYY-MM-DD"。今日以降なら「これからの予定」、過去なら「これまでの参加」に自動で振り分けられます
// booth: ブース番号（未定なら null）
const EVENTS = [
  {
    date: "2026-11-14",
    name: "ゲームマーケット2026秋",
    place: "幕張メッセ",
    booth: null,
    note: "新作を頒布予定です",
  },
  {
    date: "2026-05-10",
    name: "ゲームマーケット2026春",
    place: "幕張メッセ",
    booth: "A-00",
    note: "",
  },
];

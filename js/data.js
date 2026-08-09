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
    title: "SCLAMBLE",
    players: "3〜6人",
    time: "15～30分",
    age: "6歳～",
    desc: "羊がぐるぐる逃げ回る！？羊を巡る思惑が交差する、ドタバタバッティングゲーム！",
    image: "assets/sclamble.jpg",
    isNew: true,
    links: [
      { label: "BOOTHで見る", url: "#" },
    ],
  },
  {
    title: "メェメェメェデェ",
    players: "3〜5人",
    time: "15分",
    age: "8歳～",
    desc: "テスト前夜。起きて勉強しなきゃいけないのに、頭の中では羊たちがメェメェメェ、、",
    image: "assets/mememeday.jpg",
    isNew: false,
    links: [],
  },
  {
    title: "OUTBAAAAN",
    players: "2～4人",
    time: "15～30分",
    age: "8歳～",
    desc: "車のスピードを読み合いながら、狙うは数字と数字の”スキマ”。「爽快感×スリル」スキマ争奪カードゲーム",
    image: "assets/outbaaaan.jpg",
    isNew: false,
    links: [],
  },
];

// ---- イベント ----
// date: "YYYY-MM-DD"。今日以降なら「これからの予定」、過去なら「これまでの参加」に自動で振り分けられます
// booth: ブース番号（未定なら null）
const EVENTS = [
  {
    date: "2026-10-17",
    name: "ゲームマーケット2026秋",
    place: "幕張メッセ",
    booth: null,
    note: "新作「SCLAMBLE(スクランブル)」を頒布予定です。",
  },
   {
    date: "2026-05-24",
    name: "ゲームマーケット2026春",
    place: "幕張メッセ",
    booth: "横-20",
    note: "「メェメェメェデェ」",
  },
  {
    date: "2025-11-23",
    name: "ゲームマーケット2025秋",
    place: "幕張メッセ",
    booth: "P-32",
    note: "サークル初出展。「OUTBAAAAN」",
  },
];

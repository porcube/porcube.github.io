// ============================================
// PORCUBE サイトデータ
// ここを編集するだけで作品・イベント・リンクを更新できます
// ============================================

const SITE = {
  // GoogleフォームのURLに差し替えてください
  contactFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSclqo1ItKphMG6NdHj0ysAzMCogmRO4hHRHdxxAg83wrEtpwA/viewform",
  xUrl: "https://x.com/porcube04",
};

// ---- 作品ギャラリー ----
// image: "assets/xxx.jpg"（画像を assets フォルダに入れてパスを指定。無ければ null）
// isNew: true にすると NEW バッジが付きます
// video: "assets/xxx.mp4"（指定すると「動画を見る」ボタンが付き、ポップアップで再生）
// videoCredit: 動画の下に表示するクレジット { label: "映像制作", name: "名前", url: "リンク（任意）" }
// links: 名前とURLの組を好きなだけ（BOOTH、ゲームマーケット、ルール説明PDFなど）
//
// ▼ 作品ページ（games/〇〇.html）用の項目 ─ 編集したら `node tools/build.js` を実行
// slug: ページのファイル名（半角英数字。games/slug.html になります）
// kana: 読み方（検索用。不要なら null）
// about: 作品紹介の段落（好きなだけ）
// howto: 遊び方の流れ（1行ずつ）／ goal: 勝利条件など
// contents: 内容物／ credits: クレジット { label, name }
const GAMES = [
  {
    slug: "sclamble",
    kana: "スクランブル",
    title: "SCLAMBLE",
    players: "3〜6人",
    time: "15分",
    age: "6歳～",
    desc: "羊がぐるぐる逃げ回る！？羊を巡る思惑が交差する、ドタバタバッティングゲーム！",
    image: "assets/sclamble.jpg",
    video: "assets/scramble_pv.mp4",
    videoCredit: { label: "映像制作", name: "藍田あん", url: "https://x.com/Lantern_wf" },
    isNew: true,
    links: [
      { label: "BOOTHで見る", url: "https://porcube.booth.pm/" },
      { label: "説明書（PDF）", url: "assets/scramble_manual.pdf" },
    ],
    about: [
      "「あそこに羊が沢山いるぞ！」羊飼いたちがあちこちから押し寄せると、驚いた群れは隣の牧場へ。逃げた先には、別の羊飼いが待ち伏せしてるかも！？",
      "プレイヤーは羊飼いになって、どの牧場が狙い目かを予想しながら、羊たちを自分の小屋に誘導します。ただし、オオカミには気を付けて！",
      "全員が同時に色カードを出し、ほかの人と色がかぶる（バッティングする）と、その牧場の動物たちはいっせいに隣の牧場へ逃げ出します。読み合いとドタバタが楽しい、羊をめぐるバッティングゲームです。",
    ],
    howto: [
      "羊を獲得したい牧場と同じ色の色カードを、手札から1枚選んで裏向きに出す",
      "「せーの！」で全員いっせいにカードをオープン",
      "同じ色を出した人がいたらバッティング。その牧場の動物チップは、顔が向いている方向の隣の牧場へ移動する",
      "選んだ牧場が自分だけなら、そこにいる動物チップをすべて獲得",
      "獲得されなかった動物は夜のあいだに移動し、牧場に新しい動物が追加される",
    ],
    goal: "これを6ラウンド行い、獲得した動物チップの合計点がいちばん高い人の勝ち。白羊は1点、赤羊は2点、金羊は3点。オオカミを3匹以上集めてしまうと、小屋の羊たちが驚いて逃げ出してしまいます。",
    contents: [
      "色カード 36枚（6色×6枚）",
      "柵カード 8枚",
      "動物チップ 48枚",
      "ダイス 1個",
      "ラウンドマーカー 1枚",
      "巾着袋 1個",
      "説明書 1枚",
    ],
    credits: [
      { label: "ゲームデザイン", name: "Kazsaw" },
      { label: "アートワーク", name: "ふらぴぐ" },
      { label: "制作進行", name: "フジモリメライ" },
      { label: "Special Thanks", name: "松原誠" },
    ],
  },
  {
    slug: "mememeday",
    kana: null,
    title: "メェメェメェデェ",
    players: "3〜5人",
    time: "15分",
    age: "8歳～",
    desc: "テスト前夜。起きて勉強しなきゃいけないのに、頭の中では羊たちがメェメェメェ、、",
    image: "assets/mememeday.jpg",
    isNew: false,
    links: [
      { label: "説明書（PDF）", url: "assets/mememeday_manual.pdf" },
    ],
    about: [
      "テスト前夜。起きて勉強しなきゃいけないのに、頭の中では羊たちがメェメェメェ……。羊がたまりすぎると、ついつい仮眠してしまいます。",
      "しかもこの羊たち、みんなの頭の中を行ったり来たり。相手に送りつけたと思ったら、オオカミが現れて一斉に大移動！？ 眠気をうまく押しつけて、明日のテストで高得点を目指しましょう。",
    ],
    howto: [
      "山札から1枚引く。オオカミカードなら「メーデー！」と宣言し、すべての牧場の羊が向いている方向へ大移動",
      "手札から羊カードを1枚、自分の牧場に出す",
      "出したカードの数字以上、同じ色の羊が牧場にいれば、その枚数ぶんの羊を隣の牧場へ送り出せる",
      "手番の終わりに自分の牧場の羊が5匹以上なら仮眠。いちばん多い色の羊を引き取ることに",
    ],
    goal: "全員の手札がなくなったらゲーム終了。100点から、引き取った羊カードの数字の合計を引いたものが「テストの点数」です。いちばん点数が高い人の勝ち。",
    contents: [
      "羊カード 50枚",
      "オオカミカード 4枚",
      "レインボー羊カード 1枚",
      "説明書 1枚",
    ],
    credits: [
      { label: "ゲームデザイン", name: "Kazsaw" },
      { label: "アートワーク", name: "ふらぴぐ" },
    ],
  },
  {
    slug: "outbaaaan",
    kana: "アウトバーン",
    title: "OUTBAAAAN",
    players: "2～4人",
    time: "30分",
    age: "8歳～",
    desc: "車のスピードを読み合いながら、狙うは数字と数字の”スキマ”。「爽快感×スリル」スキマ争奪カードゲーム",
    image: "assets/outbaaaan.jpg",
    isNew: false,
    links: [ 
      { label: "BOOTHで見る", url: "https://porcube.booth.pm/" },
      { label: "説明書（PDF）", url: "assets/outbaaaan_manual.pdf" },
    ],
    about: [
      "ここは予測不能な高速道路。車カードのスピード（数字）を読み合いながら、狙うは数字と数字の“スキマ”。",
      "ピタリとハマれば得点ゲット！ でも、油断は禁物。誰かが同じスキマを狙っていたら、まさかのクラッシュでマイナス点！？ シンプルながら駆け引き満載の、“爽快感×スリル”のスキマ争奪カードゲームです。",
    ],
    howto: [
      "手札からカードを1枚選び、全員同時にオープン",
      "ギアチェンジマークの数に応じてギアチェンジマーカーを裏返す（HIGH／LOW でカードを並べる順番が変わる）",
      "出したカードを1枚ずつ場の列に配置。数字の間のスキマに入れば、連続した車の台数ぶん得点",
      "スキマがないところに割り込むとクラッシュ。ぶつかった車を引き取ってマイナス点に",
    ],
    goal: "手札がなくなるまでを1ラウンドとして3ラウンド行い、合計点がいちばん高い人の勝ちです。",
    contents: [
      "1〜30の車カード 30枚",
      "得点チップ 37枚",
      "ペナルティチップ 3枚",
      "ギアチェンジマーカー 1枚",
      "説明書 1枚",
    ],
    credits: [
      { label: "ゲームデザイン", name: "Kazsaw" },
      { label: "アートワーク", name: "ふらぴぐ" },
      { label: "制作進行", name: "フジモリメライ" },
      { label: "Special Thanks", name: "松原誠" },
    ],
  },
];

// ---- メディア掲載 ----
// 新しいものを上に書きます。編集したら `node tools/build.js` を実行
// youtube: YouTube の動画ID（URLの v= の後ろ。動画でなければ null）
// url: 記事・動画のURL ／ date: 掲載・放送時期（表示用の文字）
// game: 紹介された作品の slug（作品ページにも表示されます。無ければ null）
const MEDIA = [
  {
    outlet: "テレビ大阪ニュース",
    date: "2026年11月放送",
    title: "駆け引きが魅力⁉︎【芸人とボードゲーム作家の二刀流】大阪発ヒットゲーム誕生への挑戦",
    desc: "PORCUBEの活動に密着取材していただき、新作「SCLAMBLE」を紹介していただきました。",
    youtube: "uiPXR0X5OwY",
    url: "https://www.youtube.com/watch?v=uiPXR0X5OwY",
    game: "sclamble",
  },
];

// ---- イベント ----
// date: "YYYY-MM-DD"。今日以降なら「これからの予定」、過去なら「これまでの参加」に自動で振り分けられます
// endDate: "YYYY-MM-DD"（2日以上のイベントのみ。最終日を入れると「16–17」のように表示されます）
// booth: ブース番号（未定なら null）
const EVENTS = [
  {
    date: "2027-01-16",
    endDate: "2027-01-17",
    name: "ボードゲームビジネスエキスポジャパン",
    place: "インテックス大阪",
    booth: null,
    note: "新作「SCLAMBLE(スクランブル)」を頒布予定です。",
    url: "https://www.bgbe-j.com/",          // ← 決まったら公式サイトのURLを入れる
  },
  {
    date: "2026-10-17",
    name: "ゲームマーケット2026秋",
    place: "幕張メッセ",
    booth: null,
    note: "新作「SCLAMBLE(スクランブル)」を頒布予定です。",
    url: "https://www.gamemarket.jp/booth/6044",          // ← 決まったら公式サイトのURLを入れる
  },
   {
    date: "2026-05-24",
    name: "ゲームマーケット2026春",
    place: "幕張メッセ",
    booth: "横-20",
    note: "「メェメェメェデェ」",
    url: "https://www.gamemarket.jp/gamemarket/2026s",
  },
  {
    date: "2025-11-23",
    name: "ゲームマーケット2025秋",
    place: "幕張メッセ",
    booth: "P-32",
    note: "サークル初出展。「OUTBAAAAN」",
    url: "https://www.gamemarket.jp/gamemarket/2025a",
  },
];

// ---- メンバー ----
// 行を増やすときは { } の行をコピーしてください
const MEMBERS = [
  { name: "kazsaw", role: "ゲームデザイン", url: "" },
  { name: "ふらぴぐ", role: "アートワーク", url: "" },
  { name: "フジモリメライ", role: "制作進行", url: "" },
  { name: "コスケ", role: "Web・アプリ制作", url: "" },
  { name: "松原誠", role: "メンバー", url: "" },
];


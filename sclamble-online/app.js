/* ============================================
   SCLAMBLE ONLINE
   Firebase lobby controller
   ============================================ */

import {
  auth,
  database
} from "./firebase-config.js";

import {
  signInAnonymously,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  runTransaction,
  onDisconnect
} from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";


/* ============================================
   CONSTANTS
   ============================================ */

const MAX_PLAYERS = 6;
const TOTAL_ROUNDS = 6;

const ROOM_ID_LENGTH = 6;

/*
  0・O・1・Iなど、
  見間違えやすい文字を除外
*/
const ROOM_ID_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const PLAYER_AVATARS = [
  "🧑‍🌾",
  "🐶",
  "🐱",
  "🦊",
  "🐻",
  "🐼"
];

const PLAYER_AVATAR_COLORS = [
  "#dff4ff",
  "#ffe6cc",
  "#efe6d8",
  "#fde8f2",
  "#e7f0ff",
  "#e3f6e4"
];

const COLORS = [
  {id:"yellow", name:"黄", hex:"#e4c400", cardImg:"../assets/iro_card_front_yellow.jpg"},
  {id:"green",  name:"緑", hex:"#28a84b", cardImg:"../assets/iro_card_front_green.jpg"},
  {id:"cyan",   name:"水", hex:"#17a6d1", cardImg:"../assets/iro_card_front_blue.jpg"},
  {id:"red",    name:"赤", hex:"#e83f43", cardImg:"../assets/iro_card_front_red.jpg"},
  {id:"pink",   name:"桃", hex:"#d83aa8", cardImg:"../assets/iro_card_front_pink.jpg"},
  {id:"blue",   name:"青", hex:"#2348b8", cardImg:"../assets/iro_card_front_purple.jpg"}
];

const ANIMALS = {
  white:{label:"白羊", score:1, img:"../assets/white_chip.jpg"},
  red:{label:"赤羊", score:2, img:"../assets/red_chip.jpg"},
  gold:{label:"金羊", score:3, img:"../assets/gold_chip.jpg"},
  wolf:{label:"オオカミ", score:0, imgLeft:"../assets/wolf_left_chip.jpg", imgRight:"../assets/wolf_right_chip.jpg"}
};

const FENCES = [
  {x:50,y:10,rotation:"180deg",img:"../assets/fence_card_front_03.jpg"},
  {x:81,y:27,rotation:"240deg",img:"../assets/fence_card_front_02.jpg"},
  {x:81,y:73,rotation:"300deg",img:"../assets/fence_card_front_01.jpg"},
  {x:50,y:90,rotation:"0deg",img:"../assets/fence_card_front_06.jpg"},
  {x:19,y:73,rotation:"60deg",img:"../assets/fence_card_front_08.jpg"},
  {x:19,y:27,rotation:"120deg",img:"../assets/fence_card_front_07.jpg"}
];

const PASTURE_POSITIONS = {
  red:[32,16], cyan:[68,16], green:[85,50],
  yellow:[68,84], blue:[32,84], pink:[15,50]
};

const CHIP_ROTATIONS = {
  yellow:"-45deg", green:"-90deg", cyan:"-135deg",
  red:"135deg", blue:"45deg", pink:"90deg"
};


/* ============================================
   DOM
   ============================================ */

const connectionStatus =
  document.getElementById("connectionStatus");

const homeScreen =
  document.getElementById("homeScreen");

const lobbyScreen =
  document.getElementById("lobbyScreen");

const gameScreen =
  document.getElementById("gameScreen");

const playerNameInput =
  document.getElementById("playerName");

const roomIdInput =
  document.getElementById("roomIdInput");

const createRoomButton =
  document.getElementById("createRoomButton");

const joinRoomButton =
  document.getElementById("joinRoomButton");

const homeMessage =
  document.getElementById("homeMessage");

const roomIdDisplay =
  document.getElementById("roomIdDisplay");

const copyRoomIdButton =
  document.getElementById("copyRoomIdButton");

const playerCount =
  document.getElementById("playerCount");

const playerList =
  document.getElementById("playerList");

const waitingMessage =
  document.getElementById("waitingMessage");

const hostBadge =
  document.getElementById("hostBadge");

const hostControls =
  document.getElementById("hostControls");

const guestWaiting =
  document.getElementById("guestWaiting");

const addCpuButton =
  document.getElementById("addCpuButton");

const startGameButton =
  document.getElementById("startGameButton");

const leaveRoomButton =
  document.getElementById("leaveRoomButton");

const lobbyMessage =
  document.getElementById("lobbyMessage");

const gameRoomId = document.getElementById("gameRoomId");
const gameRoundLabel = document.getElementById("gameRoundLabel");
const onlineBoard = document.getElementById("onlineBoard");
const gameCenterGuide = document.getElementById("gameCenterGuide");
const gameCenterSub = document.getElementById("gameCenterSub");
const hostAdvanceButton = document.getElementById("hostAdvanceButton");
const guestProgress = document.getElementById("guestProgress");
const readyCount = document.getElementById("readyCount");
const gamePlayerList = document.getElementById("gamePlayerList");
const myChoiceStatus = document.getElementById("myChoiceStatus");
const colorCardList = document.getElementById("colorCardList");
const confirmChoiceButton = document.getElementById("confirmChoiceButton");
const cancelChoiceButton = document.getElementById("cancelChoiceButton");
const gamePhaseText = document.getElementById("gamePhaseText");
const onlineRevealGrid = document.getElementById("onlineRevealGrid");
const gameStepHelp = document.getElementById("gameStepHelp");
const gameLog = document.getElementById("gameLog");

const resultOverlay = document.getElementById("resultOverlay");
const finalResults = document.getElementById("finalResults");
const hostResultActions = document.getElementById("hostResultActions");
const guestResultActions = document.getElementById("guestResultActions");
const rematchButton = document.getElementById("rematchButton");
const changeSettingsButton = document.getElementById("changeSettingsButton");
const closeRoomButton = document.getElementById("closeRoomButton");
const requestRematchButton = document.getElementById("requestRematchButton");
const returnHomeButton = document.getElementById("returnHomeButton");
const rematchStatus = document.getElementById("rematchStatus");

const loadingOverlay =
  document.getElementById("loadingOverlay");

const loadingText =
  document.getElementById("loadingText");

const toast =
  document.getElementById("toast");


/* ============================================
   LOCAL STATE
   ============================================ */

let currentUser = null;
let currentRoomId = null;
let currentRoomData = null;

let roomUnsubscribe = null;
let connectionUnsubscribe = null;
let choiceUnsubscribe = null;

let intentionalLeave = false;
let toastTimer = null;
let pendingColor = null;
let lockedColor = null;
let cpuChoicesRound = null;


/* ============================================
   INITIALIZE
   ============================================ */

initialize();


async function initialize() {
  restorePlayerName();
  setConnectionStatus("Firebaseに接続しています…");

  watchFirebaseConnection();

  onAuthStateChanged(auth, async user => {
    if (user) {
      currentUser = user;

      setConnectionStatus(
        "オンライン接続済み",
        "connected"
      );

      updateHomeButtons();
      return;
    }

    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error(error);

      setConnectionStatus(
        "Firebaseへの接続に失敗しました",
        "error"
      );

      showHomeMessage(
        "匿名認証に失敗しました。Firebaseの設定を確認してください。"
      );
    }
  });
}


/* ============================================
   FIREBASE CONNECTION
   ============================================ */

function watchFirebaseConnection() {
  const connectedRef =
    ref(database, ".info/connected");

  connectionUnsubscribe = onValue(
    connectedRef,
    snapshot => {
      const connected = snapshot.val() === true;

      if (connected && currentUser) {
        setConnectionStatus(
          "オンライン接続済み",
          "connected"
        );
      } else if (!connected) {
        setConnectionStatus(
          "再接続しています…"
        );
      }
    }
  );
}


function setConnectionStatus(message, type = "") {
  connectionStatus.textContent = message;

  connectionStatus.classList.remove(
    "connected",
    "error"
  );

  if (type) {
    connectionStatus.classList.add(type);
  }
}


/* ============================================
   INPUT
   ============================================ */

playerNameInput.addEventListener("input", () => {
  clearHomeMessage();
  updateHomeButtons();
});


roomIdInput.addEventListener("input", () => {
  roomIdInput.value = normalizeRoomId(
    roomIdInput.value
  );

  clearHomeMessage();
  updateHomeButtons();
});


roomIdInput.addEventListener("keydown", event => {
  if (
    event.key === "Enter" &&
    !joinRoomButton.disabled
  ) {
    joinRoom();
  }
});


playerNameInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" &&
      !createRoomButton.disabled &&
      roomIdInput.value.length === 0
    ) {
      createRoom();
    }
  }
);


function updateHomeButtons() {
  const validName =
    isValidPlayerName(playerNameInput.value);

  const validRoomId =
    isValidRoomId(roomIdInput.value);

  createRoomButton.disabled =
    !currentUser || !validName;

  joinRoomButton.disabled =
    !currentUser ||
    !validName ||
    !validRoomId;
}


function normalizeRoomId(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ROOM_ID_LENGTH);
}


function isValidRoomId(roomId) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(roomId);
}


function sanitizePlayerName(value) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
}


function isValidPlayerName(value) {
  const name = sanitizePlayerName(value);

  return name.length >= 1 && name.length <= 12;
}


function restorePlayerName() {
  const savedName =
    localStorage.getItem("sclamblePlayerName");

  if (savedName) {
    playerNameInput.value =
      sanitizePlayerName(savedName);
  }
}


function savePlayerName(name) {
  localStorage.setItem(
    "sclamblePlayerName",
    name
  );
}


/* ============================================
   ROOM ID
   ============================================ */

function generateRoomId() {
  let roomId = "";

  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    const randomIndex = Math.floor(
      Math.random() * ROOM_ID_CHARACTERS.length
    );

    roomId +=
      ROOM_ID_CHARACTERS[randomIndex];
  }

  return roomId;
}


/* ============================================
   CREATE ROOM
   ============================================ */

createRoomButton.addEventListener(
  "click",
  createRoom
);


async function createRoom() {
  if (!currentUser) return;

  const playerName =
    sanitizePlayerName(playerNameInput.value);

  if (!isValidPlayerName(playerName)) {
    showHomeMessage(
      "プレイヤーネームを入力してください。"
    );

    return;
  }

  showLoading("部屋を作っています…");
  clearHomeMessage();

  try {
    let createdRoomId = null;

    /*
      万一ルームIDが重複した場合は
      最大10回まで作り直す
    */
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidateRoomId =
        generateRoomId();

      const candidateRoomRef =
        ref(
          database,
          `rooms/${candidateRoomId}`
        );

      const roomData = {
        hostUid: currentUser.uid,

        status: "lobby",

        totalRounds: TOTAL_ROUNDS,

        createdAt: Date.now(),

        players: {
          [currentUser.uid]: createHumanPlayer(
            currentUser.uid,
            playerName,
            0
          )
        }
      };

      const result = await runTransaction(
        candidateRoomRef,
        currentData => {
          if (currentData !== null) {
            return;
          }

          return roomData;
        },
        {
          applyLocally: false
        }
      );

      if (result.committed) {
        createdRoomId = candidateRoomId;
        break;
      }
    }

    if (!createdRoomId) {
      throw new Error(
        "ROOM_ID_CREATION_FAILED"
      );
    }

    savePlayerName(playerName);

    enterRoom(createdRoomId);
  } catch (error) {
    console.error(error);

    showHomeMessage(
      firebaseErrorMessage(
        error,
        "部屋を作成できませんでした。"
      )
    );
  } finally {
    hideLoading();
  }
}


/* ============================================
   JOIN ROOM
   ============================================ */

joinRoomButton.addEventListener(
  "click",
  joinRoom
);


async function joinRoom() {
  if (!currentUser) return;

  const playerName =
    sanitizePlayerName(playerNameInput.value);

  const roomId =
    normalizeRoomId(roomIdInput.value);

  if (!isValidPlayerName(playerName)) {
    showHomeMessage(
      "プレイヤーネームを入力してください。"
    );

    return;
  }

  if (!isValidRoomId(roomId)) {
    showHomeMessage(
      "6文字のルームIDを入力してください。"
    );

    return;
  }

  showLoading("部屋を探しています…");
  clearHomeMessage();

  try {
    const roomRef =
      ref(database, `rooms/${roomId}`);

    const roomSnapshot =
      await get(roomRef);

    if (!roomSnapshot.exists()) {
      showHomeMessage(
        "指定された部屋が見つかりません。"
      );

      return;
    }

    const roomData =
      roomSnapshot.val();

    if (roomData.status !== "lobby") {
      showHomeMessage(
        "この部屋はすでにゲーム中です。"
      );

      return;
    }

    const players =
      roomData.players || {};

    const playerEntries =
      Object.entries(players);

    /*
      同じUIDですでに参加している場合は
      そのまま再入室させる
    */
    if (players[currentUser.uid]) {
      savePlayerName(playerName);
      enterRoom(roomId);
      return;
    }

    if (playerEntries.length >= MAX_PLAYERS) {
      showHomeMessage(
        "この部屋は満員です。"
      );

      return;
    }

    const duplicateName =
      playerEntries.some(([, player]) => {
        return (
          player.type === "human" &&
          String(player.name)
            .toLowerCase() ===
          playerName.toLowerCase()
        );
      });

    if (duplicateName) {
      showHomeMessage(
        "同じ名前のプレイヤーがすでに参加しています。"
      );

      return;
    }

    const playerRef =
      ref(
        database,
        `rooms/${roomId}/players/${currentUser.uid}`
      );

    await set(
      playerRef,
      createHumanPlayer(
        currentUser.uid,
        playerName,
        playerEntries.length
      )
    );

    savePlayerName(playerName);

    enterRoom(roomId);
  } catch (error) {
    console.error(error);

    showHomeMessage(
      firebaseErrorMessage(
        error,
        "部屋へ参加できませんでした。"
      )
    );
  } finally {
    hideLoading();
  }
}


/* ============================================
   PLAYER DATA
   ============================================ */

function createHumanPlayer(
  uid,
  name,
  position
) {
  const avatarIndex =
    position % PLAYER_AVATARS.length;

  return {
    uid,
    name,
    type: "human",

    avatar:
      PLAYER_AVATARS[avatarIndex],

    avatarColor:
      PLAYER_AVATAR_COLORS[avatarIndex],

    joinedAt: Date.now(),

    online: true
  };
}


function createCpuPlayer(
  cpuId,
  name,
  position
) {
  const avatarIndex =
    position % PLAYER_AVATARS.length;

  return {
    uid: cpuId,
    name,
    type: "cpu",

    avatar:
      PLAYER_AVATARS[avatarIndex],

    avatarColor:
      PLAYER_AVATAR_COLORS[avatarIndex],

    joinedAt: Date.now(),

    online: true
  };
}


/* ============================================
   ENTER / WATCH ROOM
   ============================================ */

function enterRoom(roomId) {
  stopWatchingRoom();
  stopWatchingChoice();

  intentionalLeave = false;
  currentRoomId = roomId;

  roomIdDisplay.textContent = roomId;

  showScreen("lobby");

  watchCurrentRoom();
  watchOwnChoice();
  activatePresence();
}


function watchCurrentRoom() {
  if (!currentRoomId) return;

  const roomRef =
    ref(
      database,
      `rooms/${currentRoomId}`
    );

  roomUnsubscribe = onValue(
    roomRef,
    snapshot => {
      if (!snapshot.exists()) {
        handleRoomClosed();
        return;
      }

      const roomData =
        snapshot.val();

      currentRoomData = roomData;

      const players =
        roomData.players || {};

      /*
        自分の情報が消えた場合は
        ホストにキックされたと判断
      */
      if (
        currentUser &&
        !players[currentUser.uid] &&
        !intentionalLeave
      ) {
        handleKicked();
        return;
      }

      renderLobby(roomData);

      if (roomData.status === "game") {
        showScreen("game");
        renderGame(roomData);

        if (
          isCurrentUserHost() &&
          roomData.game?.phase === "choose"
        ) {
          ensureCpuChoices(roomData);
        }
      } else {
        resultOverlay.hidden = true;
        showScreen("lobby");
      }
    },
    error => {
      console.error(error);

      showLobbyMessage(
        "部屋の情報を取得できませんでした。"
      );
    }
  );
}


function stopWatchingRoom() {
  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }
}


function watchOwnChoice() {
  if (!currentRoomId || !currentUser) return;

  const choiceRef = ref(
    database,
    `roomChoices/${currentRoomId}/${currentUser.uid}`
  );

  choiceUnsubscribe = onValue(choiceRef, snapshot => {
    const choice = snapshot.val();
    lockedColor = choice?.colorId || null;

    if (lockedColor) {
      pendingColor = lockedColor;
    }

    if (currentRoomData?.status === "game") {
      renderGame(currentRoomData);
    }
  });
}


function stopWatchingChoice() {
  if (choiceUnsubscribe) {
    choiceUnsubscribe();
    choiceUnsubscribe = null;
  }
}


/* ============================================
   ONLINE PRESENCE
   ============================================ */

async function activatePresence() {
  if (!currentRoomId || !currentUser) {
    return;
  }

  const onlineRef =
    ref(
      database,
      `rooms/${currentRoomId}/players/${currentUser.uid}/online`
    );

  try {
    await onDisconnect(onlineRef).set(false);
    await set(onlineRef, true);
  } catch (error) {
    console.error(
      "Presence setup failed:",
      error
    );
  }
}


/* ============================================
   RENDER LOBBY
   ============================================ */

function renderLobby(roomData) {
  const playersObject =
    roomData.players || {};

  const players =
    Object.values(playersObject)
      .sort((a, b) => {
        return (
          Number(a.joinedAt || 0) -
          Number(b.joinedAt || 0)
        );
      });

  const isHost =
    currentUser &&
    roomData.hostUid === currentUser.uid;

  playerCount.textContent =
    `${players.length} / ${MAX_PLAYERS}`;

  hostBadge.hidden = !isHost;
  hostControls.hidden = !isHost;
  guestWaiting.hidden = isHost;

  addCpuButton.disabled =
    !isHost ||
    players.length >= MAX_PLAYERS;

  startGameButton.disabled =
    !isHost ||
    players.length < 1;

  waitingMessage.textContent =
    players.length >= MAX_PLAYERS
      ? "満員です"
      : "不足人数はゲーム開始時にCPUが参加します";

  playerList.replaceChildren();

  players.forEach(player => {
    playerList.appendChild(
      createPlayerElement(
        player,
        roomData,
        isHost
      )
    );
  });
}


function createPlayerElement(
  player,
  roomData,
  viewerIsHost
) {
  const isYou =
    currentUser &&
    player.uid === currentUser.uid;

  const isRoomHost =
    player.uid === roomData.hostUid;

  const isCpu =
    player.type === "cpu";

  const row =
    document.createElement("div");

  row.className = "player-row";

  if (isYou) {
    row.classList.add("you");
  }

  if (isRoomHost) {
    row.classList.add("host-player");
  }


  const avatar =
    document.createElement("div");

  avatar.className = "player-avatar";
  avatar.textContent = player.avatar || "🙂";

  avatar.style.background =
    player.avatarColor || "#f4e0bd";


  const information =
    document.createElement("div");

  information.className =
    "player-information";


  const name =
    document.createElement("div");

  name.className = "player-name";
  name.textContent = player.name;


  const tags =
    document.createElement("div");

  tags.className = "player-tags";


  if (isRoomHost) {
    tags.appendChild(
      createPlayerTag(
        "👑 ホスト",
        "host"
      )
    );
  }

  if (isYou) {
    tags.appendChild(
      createPlayerTag(
        "あなた",
        "you"
      )
    );
  }

  if (isCpu) {
    tags.appendChild(
      createPlayerTag(
        "CPU",
        "cpu"
      )
    );
  }


  information.append(
    name,
    tags
  );


  const actionArea =
    document.createElement("div");

  actionArea.className =
    "player-actions";


  if (
    viewerIsHost &&
    !isYou
  ) {
    const removeButton =
      document.createElement("button");

    removeButton.type = "button";
    removeButton.dataset.playerId =
      player.uid;

    if (isCpu) {
      removeButton.className =
        "remove-cpu-button";

      removeButton.textContent =
        "削除";
    } else {
      removeButton.className =
        "kick-button";

      removeButton.textContent =
        "キック";
    }

    actionArea.appendChild(
      removeButton
    );
  } else {
    const status =
      document.createElement("span");

    status.className =
      "player-status";

    if (
      player.online !== false ||
      isCpu
    ) {
      status.classList.add("online");
    }

    status.title =
      player.online === false
        ? "オフライン"
        : "オンライン";

    actionArea.appendChild(status);
  }


  row.append(
    avatar,
    information,
    actionArea
  );

  return row;
}


function createPlayerTag(text, type) {
  const tag =
    document.createElement("span");

  tag.className =
    `player-tag ${type}`;

  tag.textContent = text;

  return tag;
}


/* ============================================
   COPY ROOM ID
   ============================================ */

copyRoomIdButton.addEventListener(
  "click",
  copyRoomId
);


async function copyRoomId() {
  if (!currentRoomId) return;

  try {
    await navigator.clipboard.writeText(
      currentRoomId
    );

    showToast(
      `ルームID「${currentRoomId}」をコピーしました`
    );
  } catch (error) {
    console.error(error);

    showToast(
      `ルームID：${currentRoomId}`
    );
  }
}


/* ============================================
   CPU
   ============================================ */

addCpuButton.addEventListener(
  "click",
  addCpu
);


async function addCpu() {
  if (
    !currentRoomId ||
    !currentRoomData ||
    !isCurrentUserHost()
  ) {
    return;
  }

  const players =
    Object.values(
      currentRoomData.players || {}
    );

  if (players.length >= MAX_PLAYERS) {
    showToast(
      "参加人数は最大6人です。"
    );

    return;
  }

  const cpuNumbers = players
    .filter(player => player.type === "cpu")
    .map(player => {
      const match =
        String(player.name).match(/\d+/);

      return match
        ? Number(match[0])
        : 0;
    });

  let cpuNumber = 1;

  while (cpuNumbers.includes(cpuNumber)) {
    cpuNumber++;
  }

  const cpuId =
    `cpu_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const cpuRef =
    ref(
      database,
      `rooms/${currentRoomId}/players/${cpuId}`
    );

  try {
    await set(
      cpuRef,
      createCpuPlayer(
        cpuId,
        `CPU ${cpuNumber}`,
        players.length
      )
    );
  } catch (error) {
    console.error(error);

    showLobbyMessage(
      firebaseErrorMessage(
        error,
        "CPUを追加できませんでした。"
      )
    );
  }
}


/* ============================================
   KICK / REMOVE CPU
   ============================================ */

playerList.addEventListener(
  "click",
  async event => {
    const button =
      event.target.closest(
        "[data-player-id]"
      );

    if (!button) return;

    if (!isCurrentUserHost()) {
      return;
    }

    const playerId =
      button.dataset.playerId;

    const player =
      currentRoomData?.players?.[playerId];

    if (!player) return;

    const confirmationMessage =
      player.type === "cpu"
        ? `${player.name}を削除しますか？`
        : `${player.name}を部屋からキックしますか？`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      const playerRef =
        ref(
          database,
          `rooms/${currentRoomId}/players/${playerId}`
        );

      await remove(playerRef);
    } catch (error) {
      console.error(error);

      showLobbyMessage(
        "プレイヤーを削除できませんでした。"
      );
    }
  }
);


/* ============================================
   START GAME
   ============================================ */

startGameButton.addEventListener(
  "click",
  startGame
);


async function startGame() {
  if (
    !currentRoomId ||
    !currentRoomData ||
    !isCurrentUserHost()
  ) {
    return;
  }

  const playersObject = {
    ...(currentRoomData.players || {})
  };

  const players =
    Object.values(playersObject);

  if (
    players.length < 1 ||
    players.length > MAX_PLAYERS
  ) {
    showLobbyMessage(
      "参加人数を確認してください。"
    );

    return;
  }

  showLoading("ゲームを準備しています…");

  try {
    const cpuNumbers = players
      .filter(player => player.type === "cpu")
      .map(player => {
        const match =
          String(player.name).match(/\d+/);

        return match
          ? Number(match[0])
          : 0;
      });

    let nextCpuNumber = 1;
    const baseJoinedAt = Date.now();

    while (
      Object.keys(playersObject).length <
      MAX_PLAYERS
    ) {
      while (
        cpuNumbers.includes(nextCpuNumber)
      ) {
        nextCpuNumber++;
      }

      const cpuId =
        `cpu_${baseJoinedAt}_${nextCpuNumber}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;

      playersObject[cpuId] =
        createCpuPlayer(
          cpuId,
          `CPU ${nextCpuNumber}`,
          Object.keys(playersObject).length
        );

      playersObject[cpuId].joinedAt =
        baseJoinedAt + nextCpuNumber;

      cpuNumbers.push(nextCpuNumber);
      nextCpuNumber++;
    }

    const gamePlayers =
      Object.values(playersObject);

    const roomRef =
      ref(
        database,
        `rooms/${currentRoomId}`
      );

    const initialGame = createInitialGame(gamePlayers);

    await remove(
      ref(database, `roomChoices/${currentRoomId}`)
    );

    pendingColor = null;
    lockedColor = null;
    cpuChoicesRound = null;

    await update(roomRef, {
      players: playersObject,
      status: "game",
      totalRounds: TOTAL_ROUNDS,
      startedAt: Date.now(),
      game: initialGame
    });
  } catch (error) {
    console.error(error);

    showLobbyMessage(
      firebaseErrorMessage(
        error,
        "ゲームを開始できませんでした。"
      )
    );
  } finally {
    hideLoading();
  }
}


/* ============================================
   GAME INPUT
   ============================================ */

colorCardList.addEventListener("click", event => {
  const button = event.target.closest("[data-color-id]");
  if (!button || lockedColor) return;
  if (currentRoomData?.game?.phase !== "choose") return;

  pendingColor = button.dataset.colorId;
  renderGame(currentRoomData);
});


confirmChoiceButton.addEventListener("click", confirmMyChoice);
cancelChoiceButton.addEventListener("click", cancelMyChoice);
hostAdvanceButton.addEventListener("click", hostAdvanceGame);


/* ============================================
   GAME STATE
   ============================================ */

function orderedPlayers(roomData = currentRoomData) {
  return Object.values(roomData?.players || {}).sort(
    (a, b) => Number(a.joinedAt || 0) - Number(b.joinedAt || 0)
  );
}


function createInitialGame(players) {
  const sortedPlayers = [...players].sort(
    (a, b) => Number(a.joinedAt || 0) - Number(b.joinedAt || 0)
  );

  const bag = createAnimalBag();
  const pastures = Object.fromEntries(COLORS.map(color => [color.id, []]));
  const huts = Object.fromEntries(sortedPlayers.map(player => [player.uid, []]));

  COLORS.forEach(color => drawToPasture(pastures, bag, color.id, 1));

  return {
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    phase: "choose",
    bag,
    pastures,
    huts,
    ready: {},
    currentChoices: {},
    battled: [],
    rematchRequests: {},
    logs: ["ゲーム開始！ 各牧場に動物チップを1枚ずつ配置しました。"]
  };
}


function createAnimalBag() {
  const specification = [
    ["white", 18],
    ["red", 6],
    ["gold", 18],
    ["wolf", 6]
  ];

  const bag = [];
  let id = 0;

  specification.forEach(([type, count]) => {
    for (let index = 0; index < count; index++) {
      const direction =
        type === "red"
          ? 1
          : type === "wolf"
            ? (Math.random() < 0.5 ? -1 : 1)
            : -1;

      bag.push({
        id: `chip_${++id}`,
        type,
        dir: direction
      });
    }
  });

  return shuffleArray(bag);
}


function shuffleArray(values) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }

  return result;
}


function drawToPasture(pastures, bag, colorId, count) {
  if (!Array.isArray(pastures[colorId])) pastures[colorId] = [];

  for (let index = 0; index < count; index++) {
    if (!bag.length) return;
    pastures[colorId].push(bag.pop());
  }
}


function scoreChips(chips = []) {
  return chips.reduce(
    (total, chip) => total + (ANIMALS[chip.type]?.score || 0),
    0
  );
}


function countChipType(chips = [], type) {
  return chips.filter(chip => chip.type === type).length;
}


function colorName(colorId) {
  return COLORS.find(color => color.id === colorId)?.name || "";
}


function cloneGame(game) {
  return JSON.parse(JSON.stringify(game));
}


function addGameLog(game, message) {
  const logs = Array.isArray(game.logs) ? game.logs : [];
  game.logs = [...logs, message].slice(-80);
}


/* ============================================
   PRIVATE CHOICE
   ============================================ */

async function confirmMyChoice() {
  if (!currentUser || !currentRoomId || !pendingColor || lockedColor) return;
  if (currentRoomData?.game?.phase !== "choose") return;

  try {
    await update(ref(database), {
      [`roomChoices/${currentRoomId}/${currentUser.uid}`]: {
        colorId: pendingColor,
        round: currentRoomData.game.round,
        lockedAt: Date.now()
      },
      [`rooms/${currentRoomId}/game/ready/${currentUser.uid}`]: true
    });

    lockedColor = pendingColor;
  } catch (error) {
    console.error(error);
    showToast(firebaseErrorMessage(error, "色を確定できませんでした。"));
  }
}


async function cancelMyChoice() {
  if (!currentUser || !currentRoomId || !lockedColor) return;
  if (currentRoomData?.game?.phase !== "choose") return;

  try {
    await update(ref(database), {
      [`roomChoices/${currentRoomId}/${currentUser.uid}`]: null,
      [`rooms/${currentRoomId}/game/ready/${currentUser.uid}`]: null
    });

    lockedColor = null;
  } catch (error) {
    console.error(error);
    showToast(firebaseErrorMessage(error, "選択を解除できませんでした。"));
  }
}


async function ensureCpuChoices(roomData) {
  const game = roomData.game;
  if (!game || game.phase !== "choose") return;

  const guardKey = `${currentRoomId}:${game.round}`;
  if (cpuChoicesRound === guardKey) return;
  cpuChoicesRound = guardKey;

  const updates = {};
  let hasUpdates = false;

  orderedPlayers(roomData)
    .filter(player => player.type === "cpu")
    .forEach(player => {
      if (game.ready?.[player.uid]) return;

      const colorId = chooseCpuColor(player, roomData);

      updates[`roomChoices/${currentRoomId}/${player.uid}`] = {
        colorId,
        round: game.round,
        lockedAt: Date.now()
      };

      updates[`rooms/${currentRoomId}/game/ready/${player.uid}`] = true;
      hasUpdates = true;
    });

  if (!hasUpdates) return;

  try {
    await update(ref(database), updates);
  } catch (error) {
    cpuChoicesRound = null;
    console.error(error);
    showToast("CPUの選択処理に失敗しました。");
  }
}


function chooseCpuColor(player, roomData) {
  const game = roomData.game;
  const hut = game.huts?.[player.uid] || [];
  const wolfCount = countChipType(hut, "wolf");

  const scored = COLORS.map(color => {
    const chips = game.pastures?.[color.id] || [];
    const sheepValue = scoreChips(chips);
    const wolves = countChipType(chips, "wolf");
    const danger = wolves * (0.8 + wolfCount * 1.15);
    const burstDanger = wolfCount + wolves >= 3 ? 5.5 : 0;
    const noise = (Math.random() * 2 - 1) * 2.2;

    return {
      id: color.id,
      value: sheepValue - danger - burstDanger + noise
    };
  });

  scored.sort((a, b) => b.value - a.value);
  return scored[0].id;
}


/* ============================================
   HOST GAME PROGRESSION
   ============================================ */

async function hostAdvanceGame() {
  if (!isCurrentUserHost() || !currentRoomData?.game) return;

  const game = cloneGame(currentRoomData.game);

  try {
    if (game.phase === "choose") {
      await hostRevealChoices(game);
      return;
    }

    if (game.phase === "reveal") {
      moveBattledPastures(game);
      game.phase = "move";
      addGameLog(game, "バッティングした牧場の動物チップが移動しました。");
    } else if (game.phase === "move") {
      acquirePastures(game);
      game.phase = "acquire";
      addGameLog(game, "バッティングしなかったプレイヤーが動物チップを獲得しました。");
    } else if (game.phase === "acquire") {
      game.phase = "roundEnd";
      addGameLog(game, `ROUND ${game.round}が終了しました。`);
    } else if (game.phase === "roundEnd") {
      if (game.round >= TOTAL_ROUNDS) {
        game.phase = "ended";
        game.endedAt = Date.now();
        addGameLog(game, "全6ラウンド終了！ 最終順位を発表します。");
      } else {
        await prepareNextRound(game);
        return;
      }
    }

    await saveGame(game);
  } catch (error) {
    console.error(error);
    showToast(firebaseErrorMessage(error, "ゲームを進行できませんでした。"));
  }
}


async function hostRevealChoices(game) {
  const players = orderedPlayers();
  const ready = game.ready || {};
  const allReady = players.every(player => ready[player.uid] === true);

  if (!allReady) {
    showToast("全員の選択が完了していません。");
    return;
  }

  const snapshot = await get(
    ref(database, `roomChoices/${currentRoomId}`)
  );

  const privateChoices = snapshot.val() || {};
  const currentChoices = {};

  for (const player of players) {
    const choice = privateChoices[player.uid];

    if (!choice || choice.round !== game.round || !choice.colorId) {
      showToast(`${player.name}の選択を確認できません。`);
      return;
    }

    currentChoices[player.uid] = choice.colorId;
  }

  const counts = {};
  Object.values(currentChoices).forEach(colorId => {
    counts[colorId] = (counts[colorId] || 0) + 1;
  });

  game.currentChoices = currentChoices;
  game.battled = Object.keys(counts).filter(colorId => counts[colorId] >= 2);
  game.phase = "reveal";

  const summary = players
    .map(player => `${player.name}=${colorName(currentChoices[player.uid])}`)
    .join(" / ");

  addGameLog(game, `一斉オープン！ ${summary}`);

  if (game.battled.length) {
    addGameLog(
      game,
      `バッティング：${game.battled.map(colorName).join("・")}牧場`
    );
  } else {
    addGameLog(game, "今回はバッティングなし！");
  }

  await saveGame(game);
}


function moveBattledPastures(game) {
  const battled = new Set(game.battled || []);
  const original = Object.fromEntries(
    COLORS.map(color => [color.id, [...(game.pastures?.[color.id] || [])]])
  );

  const moved = Object.fromEntries(
    COLORS.map(color => [color.id, battled.has(color.id) ? [] : [...original[color.id]]])
  );

  battled.forEach(colorId => {
    const startIndex = COLORS.findIndex(color => color.id === colorId);

    original[colorId].forEach(chip => {
      let currentIndex = startIndex;

      for (let step = 0; step < COLORS.length; step++) {
        currentIndex = (
          currentIndex + chip.dir + COLORS.length
        ) % COLORS.length;

        const destination = COLORS[currentIndex].id;

        if (!battled.has(destination)) {
          moved[destination].push(chip);
          break;
        }
      }
    });
  });

  game.pastures = moved;
}


function acquirePastures(game) {
  const players = orderedPlayers();
  const choices = game.currentChoices || {};
  const counts = {};

  Object.values(choices).forEach(colorId => {
    counts[colorId] = (counts[colorId] || 0) + 1;
  });

  if (!game.huts) game.huts = {};

  players.forEach(player => {
    const colorId = choices[player.uid];
    if (!colorId || counts[colorId] !== 1) return;

    const obtained = [...(game.pastures?.[colorId] || [])];
    game.pastures[colorId] = [];

    if (!game.huts[player.uid]) game.huts[player.uid] = [];
    game.huts[player.uid].push(...obtained);

    addGameLog(
      game,
      obtained.length
        ? `${player.name}が${colorName(colorId)}牧場から${obtained.length}枚獲得。`
        : `${player.name}が選んだ${colorName(colorId)}牧場は空でした。`
    );
  });

  resolveWolfBursts(game, players);
}


function resolveWolfBursts(game, players) {
  const originalHuts = players.map(player => [...(game.huts?.[player.uid] || [])]);
  const bursting = originalHuts
    .map((hut, index) => countChipType(hut, "wolf") >= 3 ? index : -1)
    .filter(index => index >= 0);

  if (!bursting.length) return;

  const transfers = players.map(() => []);
  const nextHuts = originalHuts.map(hut => [...hut]);

  bursting.forEach(index => {
    const hut = originalHuts[index];
    const sheep = hut.filter(chip => chip.type !== "wolf");
    const wolves = hut.filter(chip => chip.type === "wolf");

    nextHuts[index] = [];

    sheep.forEach(chip => {
      const destination = (
        index + chip.dir + players.length
      ) % players.length;

      transfers[destination].push(chip);
    });

    addGameLog(
      game,
      `${players[index].name}にオオカミが3匹以上！ 羊${sheep.length}枚が隣へ逃げ、オオカミ${wolves.length}枚は除外。`
    );
  });

  players.forEach((player, index) => {
    nextHuts[index].push(...transfers[index]);
    game.huts[player.uid] = nextHuts[index];
  });
}


async function prepareNextRound(game) {
  moveWolvesAtNight(game);

  const nextRound = game.round + 1;
  const drawCount = nextRound >= 5 ? 2 : 1;

  COLORS.forEach(color => {
    drawToPasture(game.pastures, game.bag, color.id, drawCount);
  });

  game.round = nextRound;
  game.phase = "choose";
  game.ready = {};
  game.currentChoices = {};
  game.battled = [];

  addGameLog(game, "夜：牧場のオオカミが向いている方向へ1牧場移動しました。");
  addGameLog(game, `ROUND ${nextRound}準備：各牧場へチップを${drawCount}枚追加しました。`);

  await remove(ref(database, `roomChoices/${currentRoomId}`));

  pendingColor = null;
  lockedColor = null;
  cpuChoicesRound = null;

  await saveGame(game);
}


function moveWolvesAtNight(game) {
  const original = Object.fromEntries(
    COLORS.map(color => [color.id, [...(game.pastures?.[color.id] || [])]])
  );

  const next = Object.fromEntries(
    COLORS.map(color => [
      color.id,
      original[color.id].filter(chip => chip.type !== "wolf")
    ])
  );

  COLORS.forEach((color, index) => {
    original[color.id]
      .filter(chip => chip.type === "wolf")
      .forEach(chip => {
        const destinationIndex = (
          index + chip.dir + COLORS.length
        ) % COLORS.length;

        next[COLORS[destinationIndex].id].push(chip);
      });
  });

  game.pastures = next;
}


async function saveGame(game) {
  await set(
    ref(database, `rooms/${currentRoomId}/game`),
    game
  );
}


/* ============================================
   GAME RENDER
   ============================================ */

function renderGame(roomData) {
  const game = roomData.game;
  if (!game) return;

  const players = orderedPlayers(roomData);
  const ready = game.ready || {};
  const readyTotal = players.filter(player => ready[player.uid] === true).length;

  gameRoomId.textContent = currentRoomId || "------";
  gameRoundLabel.textContent = `${game.round || 1} / ${TOTAL_ROUNDS}`;
  readyCount.textContent = `選択済み ${readyTotal} / ${players.length}`;

  renderOnlineBoard(game, players);
  renderGamePlayers(game, players);
  renderColorCards(game);
  renderRevealCards(game, players);
  renderGameGuidance(game, players, readyTotal);
  renderGameLogs(game);

  if (game.phase === "ended") {
    renderFinalResults(game, players);
  } else {
    resultOverlay.hidden = true;
  }
}


function renderOnlineBoard(game, players) {
  onlineBoard
    .querySelectorAll(".online-fence-card,.online-pasture")
    .forEach(element => element.remove());

  FENCES.forEach(fence => {
    const element = document.createElement("div");
    element.className = "online-fence-card";
    element.style.left = `${fence.x}%`;
    element.style.top = `${fence.y}%`;
    element.style.setProperty("--fence-rotation", fence.rotation);

    const image = document.createElement("img");
    image.src = fence.img;
    image.alt = "柵カード";
    element.appendChild(image);
    onlineBoard.appendChild(element);
  });

  COLORS.forEach(color => {
    const pasture = document.createElement("div");
    pasture.className = "online-pasture";

    const [x, y] = PASTURE_POSITIONS[color.id];
    pasture.style.left = `${x}%`;
    pasture.style.top = `${y}%`;
    pasture.style.setProperty("--chip-rotation", CHIP_ROTATIONS[color.id]);

    const choices = game.currentChoices || {};
    const selectedPlayers = players.filter(player => choices[player.uid] === color.id);

    if (["reveal", "move", "acquire", "roundEnd", "ended"].includes(game.phase)) {
      if (selectedPlayers.length >= 2) pasture.classList.add("battled");
      if (selectedPlayers.length === 1) pasture.classList.add("target");
    }

    const head = document.createElement("div");
    head.className = "pasture-head";

    const dot = document.createElement("span");
    dot.className = "pasture-color-dot";
    dot.style.background = color.hex;

    const points = document.createElement("span");
    points.textContent = `${scoreChips(game.pastures?.[color.id] || [])}点`;
    head.append(dot, points);

    const iconList = document.createElement("div");
    iconList.className = "pasture-choice-icons";

    selectedPlayers.forEach(player => {
      const icon = document.createElement("span");
      icon.className = "pasture-choice-icon";
      icon.textContent = player.avatar || "🙂";
      icon.title = player.name;
      icon.style.background = player.avatarColor || "#fff";
      iconList.appendChild(icon);
    });

    const chipList = document.createElement("div");
    chipList.className = "animal-chip-list";

    (game.pastures?.[color.id] || []).forEach(chip => {
      chipList.appendChild(createAnimalChip(chip));
    });

    pasture.append(head, iconList, chipList);
    onlineBoard.appendChild(pasture);
  });
}


function createAnimalChip(chip) {
  const element = document.createElement("div");
  element.className = "animal-chip";

  const animal = ANIMALS[chip.type];
  const image = document.createElement("img");

  image.src = chip.type === "wolf"
    ? (chip.dir < 0 ? animal.imgLeft : animal.imgRight)
    : animal.img;

  image.alt = animal.label;
  image.title = animal.label;

  element.appendChild(image);
  return element;
}


function renderGamePlayers(game, players) {
  gamePlayerList.replaceChildren();

  players.forEach(player => {
    const hut = game.huts?.[player.uid] || [];
    const isReady = game.ready?.[player.uid] === true;
    const row = document.createElement("div");
    row.className = "game-player-row";

    if (player.uid === currentUser?.uid) row.classList.add("you");
    if (isReady) row.classList.add("ready");

    const avatar = document.createElement("div");
    avatar.className = "game-player-avatar";
    avatar.textContent = player.avatar || "🙂";
    avatar.style.background = player.avatarColor || "#f4e0bd";

    if (isReady) {
      const mark = document.createElement("span");
      mark.className = "game-player-ready-mark";
      mark.textContent = "✓";
      avatar.appendChild(mark);
    }

    const information = document.createElement("div");
    information.className = "game-player-information";

    const name = document.createElement("div");
    name.className = "game-player-name";
    name.textContent = `${player.name}${player.uid === roomDataHostUid() ? " 👑" : ""}`;

    const score = document.createElement("div");
    score.className = "game-player-score";
    score.textContent = `${scoreChips(hut)}点 / 羊${hut.filter(chip => chip.type !== "wolf").length} / 狼${countChipType(hut, "wolf")}`;

    information.append(name, score);
    row.append(avatar, information);
    gamePlayerList.appendChild(row);
  });
}


function roomDataHostUid() {
  return currentRoomData?.hostUid || "";
}


function renderColorCards(game) {
  colorCardList.replaceChildren();

  const canChoose = game.phase === "choose" && !lockedColor;

  COLORS.forEach(color => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-card-button";
    button.dataset.colorId = color.id;
    button.disabled = !canChoose;

    if (pendingColor === color.id) button.classList.add("selected");

    const image = document.createElement("img");
    image.src = color.cardImg;
    image.alt = `${color.name}カード`;
    image.draggable = false;

    button.appendChild(image);
    colorCardList.appendChild(button);
  });

  confirmChoiceButton.disabled = !pendingColor || !canChoose;
  confirmChoiceButton.hidden = game.phase !== "choose" || Boolean(lockedColor);
  cancelChoiceButton.hidden = game.phase !== "choose" || !lockedColor;

  myChoiceStatus.textContent = lockedColor
    ? `${colorName(lockedColor)}で決定済み`
    : pendingColor
      ? `${colorName(pendingColor)}を選択中`
      : "未選択";
}


function renderRevealCards(game, players) {
  onlineRevealGrid.replaceChildren();
  const revealed = ["reveal", "move", "acquire", "roundEnd", "ended"].includes(game.phase);

  players.forEach(player => {
    const card = document.createElement("div");
    card.className = "online-reveal-card";
    if (player.uid === currentUser?.uid) card.classList.add("you");

    const name = document.createElement("div");
    name.className = "online-reveal-name";
    name.textContent = `${player.avatar || "🙂"} ${player.name}`;
    card.appendChild(name);

    if (revealed && game.currentChoices?.[player.uid]) {
      const color = COLORS.find(item => item.id === game.currentChoices[player.uid]);
      const image = document.createElement("img");
      image.className = "online-reveal-image";
      image.src = color.cardImg;
      image.alt = `${color.name}カード`;
      card.appendChild(image);
    } else {
      const hidden = document.createElement("div");
      hidden.className = "online-reveal-hidden";

      if (game.ready?.[player.uid]) {
        hidden.classList.add("ready");
        hidden.textContent = "選択済み ✓";
      } else {
        hidden.textContent = "選択中…";
      }

      card.appendChild(hidden);
    }

    onlineRevealGrid.appendChild(card);
  });
}


function renderGameGuidance(game, players, readyTotal) {
  const isHost = isCurrentUserHost();
  const allReady = readyTotal === players.length && players.length > 0;
  hostAdvanceButton.hidden = !isHost;
  guestProgress.hidden = isHost;

  const phaseText = {
    choose:"色カードを選択中",
    reveal:"カード公開中",
    move:"動物チップ移動後",
    acquire:"動物チップ獲得後",
    roundEnd:"ラウンド終了",
    ended:"ゲーム終了"
  };

  gamePhaseText.textContent = phaseText[game.phase] || "";

  if (game.phase === "choose") {
    gameCenterGuide.textContent = allReady ? "全員の選択完了！" : "色カードを選ぼう！";
    gameCenterSub.textContent = allReady ? "ホストが公開します" : "ほかの人には選択した色は見えません";
    gameStepHelp.textContent = lockedColor
      ? "選択を確定しました。全員が選び終わるまでお待ちください。"
      : "欲しい牧場の色カードを選び、「色を決定する」を押してください。";
    hostAdvanceButton.textContent = allReady ? "カードを一斉公開" : "全員の選択を待っています";
    hostAdvanceButton.disabled = !allReady;
    guestProgress.textContent = lockedColor ? "選択済み・ホストの進行待ち" : "色を選択してください";
  } else if (game.phase === "reveal") {
    gameCenterGuide.textContent = game.battled?.length ? "バッティング発生！" : "バッティングなし！";
    gameCenterSub.textContent = "選ばれたカードを確認してください";
    gameStepHelp.textContent = "同じ色を選んだプレイヤーは牧場を獲得できません。";
    hostAdvanceButton.textContent = "動物チップを移動";
    hostAdvanceButton.disabled = false;
    guestProgress.textContent = "ホストが動物チップを移動します";
  } else if (game.phase === "move") {
    gameCenterGuide.textContent = "移動を確認！";
    gameCenterSub.textContent = "次は牧場の獲得です";
    gameStepHelp.textContent = "バッティングした牧場のチップが、向いている方向へ移動しました。";
    hostAdvanceButton.textContent = "動物チップを獲得";
    hostAdvanceButton.disabled = false;
    guestProgress.textContent = "ホストが獲得処理を行います";
  } else if (game.phase === "acquire") {
    gameCenterGuide.textContent = "小屋を確認！";
    gameCenterSub.textContent = "得点とオオカミの数をチェック";
    gameStepHelp.textContent = "バッティングしなかったプレイヤーが牧場のチップを獲得しました。";
    hostAdvanceButton.textContent = "ラウンド終了";
    hostAdvanceButton.disabled = false;
    guestProgress.textContent = "ホストがラウンドを終了します";
  } else if (game.phase === "roundEnd") {
    gameCenterGuide.textContent = game.round >= TOTAL_ROUNDS ? "全ラウンド終了！" : "次のラウンドへ！";
    gameCenterSub.textContent = game.round >= TOTAL_ROUNDS ? "最終順位を確認します" : "夜の処理とチップ補充を行います";
    gameStepHelp.textContent = `ROUND ${game.round}が終了しました。`;
    hostAdvanceButton.textContent = game.round >= TOTAL_ROUNDS ? "最終結果を見る" : "次のラウンド";
    hostAdvanceButton.disabled = false;
    guestProgress.textContent = "ホストの進行を待っています";
  } else {
    hostAdvanceButton.disabled = true;
    guestProgress.textContent = "ゲーム終了";
  }
}


function renderGameLogs(game) {
  gameLog.replaceChildren();

  (game.logs || []).forEach(message => {
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    gameLog.appendChild(paragraph);
  });

  gameLog.scrollTop = gameLog.scrollHeight;
}


function renderFinalResults(game, players) {
  const ranked = players
    .map(player => {
      const hut = game.huts?.[player.uid] || [];
      return {
        ...player,
        score: scoreChips(hut),
        sheep: hut.filter(chip => chip.type !== "wolf").length
      };
    })
    .sort((a, b) => b.score - a.score || b.sheep - a.sheep);

  const bestScore = ranked[0]?.score || 0;
  const bestSheep = ranked[0]?.sheep || 0;

  finalResults.replaceChildren();

  ranked.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "final-result-row";

    if (player.score === bestScore && player.sheep === bestSheep) {
      row.classList.add("winner");
    }

    const rank = document.createElement("div");
    rank.className = "final-result-rank";
    rank.textContent = `${index + 1}位`;

    const name = document.createElement("div");
    name.className = "final-result-player";
    name.textContent = `${player.avatar || "🙂"} ${player.name}${row.classList.contains("winner") ? " 🏆" : ""}`;

    const score = document.createElement("div");
    score.className = "final-result-score";
    score.textContent = `${player.score}点 / 羊${player.sheep}`;

    row.append(rank, name, score);
    finalResults.appendChild(row);
  });

  const isHost = isCurrentUserHost();
  hostResultActions.hidden = !isHost;
  guestResultActions.hidden = isHost;

  const requests = game.rematchRequests || {};
  const requestTotal = players.filter(player => requests[player.uid]).length;
  rematchStatus.textContent = `リマッチ希望 ${requestTotal} / ${players.length}`;
  requestRematchButton.disabled = Boolean(requests[currentUser?.uid]);
  requestRematchButton.textContent = requests[currentUser?.uid]
    ? "リマッチ希望済み ✓"
    : "リマッチ希望";

  resultOverlay.hidden = false;
}


/* ============================================
   RESULT ACTIONS
   ============================================ */

rematchButton.addEventListener("click", async () => {
  if (!isCurrentUserHost()) return;
  const players = orderedPlayers();
  showLoading("リマッチを準備しています…");

  try {
    await remove(ref(database, `roomChoices/${currentRoomId}`));
    await update(ref(database, `rooms/${currentRoomId}`), {
      status: "game",
      startedAt: Date.now(),
      game: createInitialGame(players)
    });
    pendingColor = null;
    lockedColor = null;
    cpuChoicesRound = null;
    resultOverlay.hidden = true;
  } finally {
    hideLoading();
  }
});


changeSettingsButton.addEventListener("click", async () => {
  if (!isCurrentUserHost()) return;

  await remove(ref(database, `roomChoices/${currentRoomId}`));
  await update(ref(database, `rooms/${currentRoomId}`), {
    status: "lobby",
    game: null,
    startedAt: null
  });

  pendingColor = null;
  lockedColor = null;
  cpuChoicesRound = null;
  resultOverlay.hidden = true;
});


closeRoomButton.addEventListener("click", async () => {
  if (!isCurrentUserHost()) return;
  if (!window.confirm("部屋を解散してホームへ戻りますか？")) return;

  intentionalLeave = true;
  await remove(ref(database, `roomChoices/${currentRoomId}`));
  await remove(ref(database, `rooms/${currentRoomId}`));
  resetLocalRoomState();
  resultOverlay.hidden = true;
  showScreen("home");
});


requestRematchButton.addEventListener("click", async () => {
  if (!currentRoomId || !currentUser) return;

  try {
    await set(
      ref(database, `rooms/${currentRoomId}/game/rematchRequests/${currentUser.uid}`),
      true
    );
  } catch (error) {
    console.error(error);
    showToast(firebaseErrorMessage(error, "リマッチ希望を送信できませんでした。"));
  }
});


returnHomeButton.addEventListener("click", async () => {
  resultOverlay.hidden = true;
  await leaveCurrentRoom();
});


/* ============================================
   LEAVE ROOM
   ============================================ */

leaveRoomButton.addEventListener(
  "click",
  leaveCurrentRoom
);


async function leaveCurrentRoom() {
  if (
    !currentRoomId ||
    !currentUser
  ) {
    return;
  }

  const confirmed = window.confirm(
    isCurrentUserHost()
      ? "部屋から退出しますか？ほかに人間の参加者がいれば、その人が新しいホストになります。"
      : "部屋から退出しますか？"
  );

  if (!confirmed) return;

  intentionalLeave = true;
  showLoading("部屋から退出しています…");

  try {
    const roomId = currentRoomId;
    const players =
      Object.values(
        currentRoomData?.players || {}
      );

    if (isCurrentUserHost()) {
      const otherHumans = players
        .filter(player => {
          return (
            player.type === "human" &&
            player.uid !== currentUser.uid
          );
        })
        .sort((a, b) => {
          return (
            Number(a.joinedAt || 0) -
            Number(b.joinedAt || 0)
          );
        });

      if (otherHumans.length === 0) {
        await remove(
          ref(
            database,
            `rooms/${roomId}`
          )
        );
      } else {
        await update(
          ref(
            database,
            `rooms/${roomId}`
          ),
          {
            hostUid:
              otherHumans[0].uid,

            [`players/${currentUser.uid}`]:
              null
          }
        );
      }
    } else {
      await remove(
        ref(
          database,
          `rooms/${roomId}/players/${currentUser.uid}`
        )
      );
    }

    resetLocalRoomState();
    showScreen("home");

    showHomeMessage(
      "部屋から退出しました。",
      true
    );
  } catch (error) {
    console.error(error);

    intentionalLeave = false;

    showLobbyMessage(
      firebaseErrorMessage(
        error,
        "部屋から退出できませんでした。"
      )
    );
  } finally {
    hideLoading();
  }
}


/* ============================================
   ROOM CLOSED / KICKED
   ============================================ */

function handleRoomClosed() {
  if (intentionalLeave) return;

  resetLocalRoomState();
  showScreen("home");

  showHomeMessage(
    "部屋が解散されました。"
  );
}


function handleKicked() {
  resetLocalRoomState();
  showScreen("home");

  showHomeMessage(
    "ホストによって部屋から退出されました。"
  );
}


function resetLocalRoomState() {
  stopWatchingRoom();
  stopWatchingChoice();

  currentRoomId = null;
  currentRoomData = null;
  intentionalLeave = false;
  pendingColor = null;
  lockedColor = null;
  cpuChoicesRound = null;

  roomIdDisplay.textContent = "------";
  playerList.replaceChildren();
  roomIdInput.value = "";

  if (resultOverlay) {
    resultOverlay.hidden = true;
  }

  updateHomeButtons();
}


/* ============================================
   HELPERS
   ============================================ */

function isCurrentUserHost() {
  return Boolean(
    currentUser &&
    currentRoomData &&
    currentRoomData.hostUid ===
      currentUser.uid
  );
}


function showScreen(screenName) {
  homeScreen.hidden =
    screenName !== "home";

  lobbyScreen.hidden =
    screenName !== "lobby";

  gameScreen.hidden =
    screenName !== "game";
}


function showLoading(message = "通信中…") {
  loadingText.textContent = message;
  loadingOverlay.hidden = false;
}


function hideLoading() {
  loadingOverlay.hidden = true;
}


function showHomeMessage(
  message,
  success = false
) {
  homeMessage.textContent = message;

  homeMessage.classList.toggle(
    "success",
    success
  );
}


function clearHomeMessage() {
  homeMessage.textContent = "";
  homeMessage.classList.remove("success");
}


function showLobbyMessage(
  message,
  success = false
) {
  lobbyMessage.textContent = message;

  lobbyMessage.classList.toggle(
    "success",
    success
  );
}


function showToast(message) {
  window.clearTimeout(toastTimer);

  toast.textContent = message;
  toast.hidden = false;

  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}


function firebaseErrorMessage(
  error,
  fallbackMessage
) {
  const code = String(
    error?.code || ""
  )
    .toLowerCase()
    .replaceAll("_", "-");

  if (code.includes("permission-denied")) {
    return "Firebaseのアクセス権限がありません。Security Rulesを確認してください。";
  }

  if (code.includes("network")) {
    return "ネットワーク接続を確認してください。";
  }

  return fallbackMessage;
}

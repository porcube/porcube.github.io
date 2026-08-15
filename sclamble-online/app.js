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

const temporaryReturnButton =
  document.getElementById("temporaryReturnButton");

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

let intentionalLeave = false;
let toastTimer = null;


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

  intentionalLeave = false;
  currentRoomId = roomId;

  roomIdDisplay.textContent = roomId;

  showScreen("lobby");

  watchCurrentRoom();
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
      } else {
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

  temporaryReturnButton.hidden = !isHost;

  addCpuButton.disabled =
    !isHost ||
    players.length >= MAX_PLAYERS;

  startGameButton.disabled =
    !isHost ||
    players.length < 1;

  waitingMessage.textContent =
    players.length >= MAX_PLAYERS
      ? "満員です"
      : "参加者を待っています…";

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

  const players =
    Object.values(
      currentRoomData.players || {}
    );

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
    const roomRef =
      ref(
        database,
        `rooms/${currentRoomId}`
      );

    await update(roomRef, {
      status: "game",
      totalRounds: TOTAL_ROUNDS,
      startedAt: Date.now()
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
   TEMPORARY RETURN TO LOBBY
   ============================================ */

temporaryReturnButton.addEventListener(
  "click",
  async () => {
    if (
      !currentRoomId ||
      !isCurrentUserHost()
    ) {
      showToast(
        "ホストだけが待機部屋へ戻せます。"
      );

      return;
    }

    try {
      await update(
        ref(
          database,
          `rooms/${currentRoomId}`
        ),
        {
          status: "lobby"
        }
      );
    } catch (error) {
      console.error(error);

      showToast(
        "待機部屋へ戻れませんでした。"
      );
    }
  }
);


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

  currentRoomId = null;
  currentRoomData = null;
  intentionalLeave = false;

  roomIdDisplay.textContent = "------";
  playerList.replaceChildren();
  roomIdInput.value = "";

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
  );

  if (code.includes("permission-denied")) {
    return "Firebaseのアクセス権限がありません。Security Rulesを確認してください。";
  }

  if (code.includes("network")) {
    return "ネットワーク接続を確認してください。";
  }

  return fallbackMessage;
}
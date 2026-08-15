import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth
} from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getDatabase
} from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB9CjNM06zo3yjZWg7vPjAFLW5GIlhkTE",
  authDomain: "sclamble-online.firebaseapp.com",
  databaseURL:
    "https://sclamble-online-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sclamble-online",
  storageBucket: "sclamble-online.firebasestorage.app",
  messagingSenderId: "465860414316",
  appId: "1:465860414316:web:439f2b1a4e36ce94274149",
  measurementId: "G-3WFJZ44CNX"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

export {
  auth,
  database
};
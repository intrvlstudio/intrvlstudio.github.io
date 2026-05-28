/* =========================================================
   INTRVL Studio — Firebase Authentication (shared module)
   ---------------------------------------------------------
   成員登入系統的共用設定。login.html 與 members.html 都會 import 這支檔案。

   ▼ 設定步驟（只需做一次）：
   1. 到 https://console.firebase.google.com/ 建立一個新專案
   2. 左側 Build → Authentication → 點「Get started」
        → Sign-in method 分頁 → 啟用「Email/Password」
   3. Users 分頁 → 「Add user」，手動為每位工作室成員建立帳號
        （Email + 密碼）。不開放公開註冊 = 只有你加的人能登入。
   4. 專案設定（齒輪圖示 → Project settings）→ 往下到「Your apps」
        → 點 </> (Web) 註冊一個 Web App → 複製 firebaseConfig
        貼到下方取代占位字串。
   5. Authentication → Settings → Authorized domains
        → 新增你的網域： intrvlstudio.github.io
        （localhost 預設已在清單中，方便本機測試）

   ⚠️ 安全提醒：firebaseConfig 裡的 apiKey 公開沒關係，它不是密碼，
      只是用來識別專案。真正的安全來自上面第 5 步的「授權網域」與
      Authentication 的後端驗證。請勿在這裡寫任何成員密碼。
   ========================================================= */

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ▼▼▼ 把下面整段換成你 Firebase 專案的設定 ▼▼▼ */
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};
/* ▲▲▲ 換完即可，其餘不用動 ▲▲▲ */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* 讓登入狀態保存在瀏覽器（關閉分頁再回來仍維持登入） */
setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

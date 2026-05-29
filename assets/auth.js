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
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromCache,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ▼▼▼ INTRVL Studio Firebase 專案設定 ▼▼▼ */
const firebaseConfig = {
  apiKey: "AIzaSyCDzNWIyOtzviVPpCrPFMfkhVXMBSsVtZw",
  authDomain: "intrvl-studio.firebaseapp.com",
  projectId: "intrvl-studio",
  storageBucket: "intrvl-studio.firebasestorage.app",
  messagingSenderId: "482541745497",
  appId: "1:482541745497:web:d53b80595147f8571d8848",
  measurementId: "G-BXG250PCXZ"
};
/* ▲▲▲ ▲▲▲ */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* 啟用本機持久快取（IndexedDB）：
   重複造訪時可先從快取即時顯示，再向伺服器更新，大幅加快感知速度。
   persistentMultipleTabManager 讓多分頁共用同一份快取，避免衝突。 */
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

/* 讓登入狀態保存在瀏覽器（關閉分頁再回來仍維持登入） */
setPersistence(auth, browserLocalPersistence).catch(() => {});

/* 檢查目前登入者是不是管理員。
   作法：在 Firestore 建一個 admins 集合，文件 ID = 該成員的 User UID
   （UID 可在 Authentication → Users 找到）。有文件 = 管理員。
   安全規則會在後端再次驗證，所以這只是用來決定要不要顯示編輯介面。 */
async function isAdmin(uid) {
  if (!uid) return false;
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    return snap.exists();
  } catch (e) {
    return false;
  }
}

/* 快速連結的分類定義（members.html 與 publish.html 共用一份）。
   要新增分類：在這裡加一筆，並同步更新 firestore.rules 的
   d.category in [...] 名單。 */
const CATS = [
  { id: 'work',  label: { 'zh-TW': '工作相關', en: 'Work',  ko: '업무 관련' } },
  { id: 'staff', label: { 'zh-TW': '員工相關', en: 'Staff', ko: '직원 관련' } }
];

export {
  CATS,
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  /* Firestore */
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromCache,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  isAdmin
};

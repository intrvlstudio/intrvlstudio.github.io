# 成員登入系統設定指南 / Members Login Setup

這個網站用 **Firebase Authentication** 做成員登入。GitHub Pages 只能放靜態檔，
所以驗證工作交給 Google 的 Firebase 後端，安全且免費。

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `login.html` | 成員登入頁 |
| `members.html` | 登入後的成員專區（公告 / 連結改由 Firestore 載入） |
| `assets/auth.js` | Firebase Auth + Firestore 共用程式 |
| `firestore.rules` | Firestore 安全規則（需貼到 Console 發布） |

## 一次性設定步驟

1. 前往 <https://console.firebase.google.com/> 用 Google 帳號建立新專案。
2. 左側 **Build → Authentication → Get started**。
3. 在 **Sign-in method** 分頁啟用 **Email/Password**。
4. 在 **Users** 分頁點 **Add user**，為每位工作室成員建立帳號（Email + 密碼）。
   - 不開放公開註冊，所以只有你手動加入的人能登入。
5. **專案設定（齒輪 → Project settings）→ Your apps → 點 `</>` (Web)** 註冊一個 Web App，
   複製 `firebaseConfig` 物件。
6. 打開 `assets/auth.js`，把 `firebaseConfig` 裡的占位字串換成你複製的值。
7. 回到 **Authentication → Settings → Authorized domains**，
   新增 `intrvlstudio.github.io`（`localhost` 預設已在清單中）。

完成後 push 到 GitHub，登入功能即生效。

## 設定 Firestore（公告與連結的資料庫）

成員頁的「公告」與「快速連結」是存在 Firestore，登入後才從後端拿到，
所以**內容真正鎖在後端、不會出現在公開的 HTML 原始碼裡**。

1. Firebase Console → **Build → Firestore Database → Create database**。
   - 位置選離台灣近的（例如 `asia-east1`）。
   - 模式先選 **Production mode**（規則我們會自己貼）。
2. 切到 **Rules** 分頁，把 `firestore.rules` 的內容整段貼上 → **Publish**。
3. **指定管理員**（決定誰能新增/刪除公告與連結）：
   - 到 **Authentication → Users**，複製你自己帳號的 **User UID**。
   - 回到 **Firestore Database → Data**，建立一個集合 `admins`，
     新增一份文件，**Document ID 填入剛剛複製的 UID**（欄位留空或隨意都行）。
   - 之後用那個帳號登入成員頁，就會看到「新增公告 / 新增連結」的編輯介面。

### 資料結構（系統會自動建立，了解即可）

| 集合 | 欄位 |
|------|------|
| `announcements` | `title`、`body`、`createdAt` |
| `links` | `title`、`desc`、`url`、`createdAt` |
| `admins` | 文件 ID = 管理員的 UID |

## 日常管理

- **發公告 / 加連結**：用管理員帳號登入 `members.html`，直接在頁面上新增、刪除。
  （也可以在 Firebase Console → Firestore → Data 手動編輯。）
- **新增成員**：Firebase Console → Authentication → Users → Add user。
- **移除成員**：在 Users 清單刪除該帳號。
- **重設密碼**：在 Users 清單對該帳號操作，或啟用「忘記密碼」郵件功能。
- **增加管理員**：在 `admins` 集合再新增一份以該成員 UID 為 ID 的文件。

## 安全須知（重要）

- `firebaseConfig` 裡的 `apiKey` **公開沒關係**，它只是專案識別碼，不是密碼。
  真正的防護來自「授權網域」、Authentication 後端驗證，以及 Firestore 安全規則。
- 公告與連結內容存在 Firestore，受 `firestore.rules` 保護：**沒登入完全讀不到**，
  只有 `admins` 名單裡的人能修改。這些規則跑在 Google 後端，前端無法繞過。
- `members.html` 這個檔案本身仍是公開靜態檔，但它現在只剩版面骨架、**不含任何
  機密內容**，所以即使有人看原始碼也拿不到資料。
- 永遠不要把任何成員密碼寫進這些檔案。

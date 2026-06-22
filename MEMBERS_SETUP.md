# 成員登入系統設定指南 / Members Login Setup

這個網站用 **Firebase Authentication** 做成員登入。GitHub Pages 只能放靜態檔，
所以驗證工作交給 Google 的 Firebase 後端，安全且免費。

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `login.html` | 成員登入頁 |
| `members.html` | 登入後的「內部空間」工作台：主控版／最新消息／專案內容／文件下載／APP／員工資料（管理員）／設定，全部單頁切換、左側選單常駐 |
| `publish.html` / `staff.html` | 舊的獨立發佈頁／員工後台，功能已整合進 `members.html` 的頁面內彈窗與分頁；這兩個檔案保留為轉址頁（導回 `members.html`） |
| `assets/auth.js` | Firebase Auth + Firestore 共用程式 |
| `firestore.rules` | Firestore 安全規則（需貼到 Console 發布） |

> 管理員的「新增 / 編輯 / 刪除」內容,全部在 `members.html` 各分頁右上角的「＋ 新增」按鈕與卡片／列上的編輯鈕,以**頁面內彈窗**完成,不再另開頁面。

## 一次性設定步驟

1. 前往 <https://console.firebase.google.com/> 用 Google 帳號建立新專案。
2. 左側 **Build → Authentication → Get started**。
3. 在 **Sign-in method** 分頁啟用 **Email/Password**。
4. 在 **Users** 分頁點 **Add user**，為每位工作室成員建立帳號（Email + 密碼）。
   - 不開放公開註冊，所以只有你手動加入的人能登入。
5. **專案設定（齒輪 → Project settings）→ Your apps → 點 `</>` (Web)** 註冊一個 Web App，
   複製 `firebaseConfig` 物件。
6. 打開 `assets/auth.js`，把 `firebaseConfig` 裡的值換成你複製的設定。
   （本專案已填入 `intrvl-studio` 的設定，若沿用同一專案此步可略過。）
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

`firestore.rules` 會在後端強制以下欄位與限制，不符合的寫入會被拒絕：

| 集合 | 用途 | 主要欄位 |
|------|------|----------|
| `announcements` | 最新消息 | `title`（≤150）、`body`（≤8000）、`type`（分享/專案/人事/活動/系統/重要）、`image`（1:1 壓縮圖 data URL，≤800KB）、`date`（YYYY-MM-DD）、`createdAt` |
| `projects` | 專案內容 | `title`、`desc`（≤500）、`url`（http(s) 或空）、`thumb`（25×25 小圖 data URL）、`kind`（BL/BG/空）、`status`（producing/planning/done）、`year`、`createdAt` |
| `documents` | 文件下載 | `docType`、`title`、`desc`（≤2000）、`url`、`createdAt` |
| `apps` | APP | `icon`（方形圖示 data URL）、`name`、`desc`、`usage`（使用說明）、`downloadUrl`、`createdAt` |
| `staff` | 員工完整檔案（僅管理員可讀寫） | `empNo`、`name`、`alias`、`email`、`status`、`jobTitle`、`mobile`、`address`、`birthday`、`nationalId`、`passport`、`hireDate`、`leaveDate`、`loginPassword`、`note`、`avatar`、`updatedAt` |
| `profiles` | 員工公開小卡（資料卡同步用） | 文件 ID＝員工 email（小寫）；`name`、`alias`、`avatar`、`jobTitle`、`updatedAt`。管理員可寫，員工本人只能讀自己那筆 |
| `admins` | 管理員名單 | 文件 ID＝管理員的 UID，只能在 Console 手動建立 |
| `links` | （舊版快速連結，保留相容，目前介面已不使用） | — |

> 規則只接受各集合列出的欄位（`hasOnly`），塞入額外欄位會被拒絕。圖片一律壓縮成
> base64 存進文件（沒有另接 Firebase Storage），所以有大小上限。

> ⚠️ **改過 `firestore.rules` 後要重新發布**：Firebase Console → Firestore Database
> → **Rules** 分頁 → 貼上最新的 `firestore.rules` → **Publish**。`profiles` 集合
> 不需手動建立，員工第一次在成員頁按「編輯」儲存時會自動建立自己的那筆。

## 日常管理

- **新增內容**：用管理員帳號登入後，到對應分頁（最新消息 / 專案內容 / 文件下載 / APP）
  點右上角「＋ 新增」，在跳出的彈窗填表單送出。
- **編輯 / 刪除**：在各分頁的卡片或列上點鉛筆（編輯，開同一個彈窗）或垃圾桶（刪除）。
  （也可以在 Firebase Console → Firestore → Data 手動編輯。）
- **員工資料**：管理員專屬的「員工資料」分頁統一維護所有員工檔案；姓名／代稱／職稱／
  大頭照會自動同步到該員工的「員工資料卡」（`profiles`）。員工本人登入只看得到自己的
  資料卡，改不了。
- **新增成員**：Firebase Console → Authentication → Users → Add user（再到「員工資料」分頁補檔案）。
- **移除成員**：在 Users 清單刪除該帳號。
- **重設密碼**：在 Users 清單對該帳號操作，或啟用「忘記密碼」郵件功能。
- **增加管理員**：在 `admins` 集合再新增一份以該成員 UID 為 ID 的文件。

> ⚠️ **改過 `firestore.rules` 後一定要重新發布**，而且因為線上程式與規則必須同步：
> 若是「移除欄位」這類收緊規則的改動，請**先讓新版網頁上線**，再去 Console 發布新規則，
> 否則線上舊程式送出的舊欄位會被擋下（出現 Missing or insufficient permissions）。

## 安全須知（重要）

- `firebaseConfig` 裡的 `apiKey` **公開沒關係**，它只是專案識別碼，不是密碼。
  真正的防護來自「授權網域」、Authentication 後端驗證，以及 Firestore 安全規則。
- 公告與連結內容存在 Firestore，受 `firestore.rules` 保護：**沒登入完全讀不到**，
  只有 `admins` 名單裡的人能修改。這些規則跑在 Google 後端，前端無法繞過。
- **寫入內容會在後端驗證**：欄位白名單、長度上限、連結協定（只允許 `http(s)://`、
  擋掉 `javascript:` 等），以及 `createdAt` 必須是伺服器時間。即使有人略過前端
  直接打 API，也無法塞入不合規的資料。
- **連結顯示防 XSS**：`members.html` 的 `safeUrl()` 在渲染前再驗一次連結協定，
  與後端規則雙重把關，避免惡意連結被當成可點擊項目。
- `members.html` 這個檔案本身仍是公開靜態檔，但它現在只剩版面骨架、**不含任何
  機密內容**，所以即使有人看原始碼也拿不到資料。
- 永遠不要把任何成員密碼寫進這些檔案。

# 成員登入系統設定指南 / Members Login Setup

這個網站用 **Firebase Authentication** 做成員登入。GitHub Pages 只能放靜態檔，
所以驗證工作交給 Google 的 Firebase 後端，安全且免費。

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `login.html` | 成員登入頁 |
| `members.html` | 登入後的成員專區（範例內容，請自行替換） |
| `assets/auth.js` | Firebase 設定與共用程式（**需要填入你的設定**） |

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

## 日常管理

- **新增成員**：Firebase Console → Authentication → Users → Add user。
- **移除成員**：在 Users 清單刪除該帳號。
- **重設密碼**：在 Users 清單對該帳號操作，或啟用「忘記密碼」郵件功能。

## 安全須知（重要）

- `firebaseConfig` 裡的 `apiKey` **公開沒關係**，它只是專案識別碼，不是密碼。
  真正的防護來自「授權網域」與後端驗證。
- 但 GitHub Pages 上的 `members.html` 檔案**本身是公開的靜態檔**。登入機制會把
  未登入者踢回登入頁，但知道確切網址的人仍可能直接下載原始 HTML。
- 因此：成員頁適合放「公告、內部連結、一般資訊」。若有**真正機密、絕不能外流**
  的內容，需改存進 **Firestore 資料庫**並用安全規則綁定登入身分（可再擴充）。
- 永遠不要把任何成員密碼寫進這些檔案。

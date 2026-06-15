# 閃電貸 — Heroku 部署完整指南

## 一、事前準備

在開始之前，您需要準備以下帳號與服務：

| 服務 | 用途 | 費用 |
|------|------|------|
| [Heroku](https://heroku.com) | 主機伺服器 | 最低 $7/月（Basic Dyno） |
| [PlanetScale](https://planetscale.com) 或 [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql) | MySQL 資料庫 | 免費方案可用 |
| [Cloudflare R2](https://cloudflare.com/r2) 或 [AWS S3](https://aws.amazon.com/s3/) | 證件圖片儲存 | 免費額度內幾乎免費 |

---

## 二、資料庫選擇建議

### 推薦方案：PlanetScale（MySQL）
- 免費方案：1 個資料庫、5GB 儲存
- 與專案使用的 MySQL/Drizzle ORM 完全相容
- 提供連線字串，格式為：`mysql://user:password@host/dbname?ssl={"rejectUnauthorized":true}`

### 備選方案：JawsDB MySQL（Heroku Add-on）
- 直接在 Heroku 後台新增，最方便
- 免費方案：5MB（僅測試用），付費方案 $10/月起

---

## 三、部署步驟

### 步驟 1：安裝 Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows（下載安裝程式）
# https://devcenter.heroku.com/articles/heroku-cli
```

### 步驟 2：登入並建立 App

```bash
heroku login
heroku create shandaidai
# 或自訂名稱：heroku create your-app-name
```

### 步驟 3：設定 Node.js 版本

Heroku 會自動讀取專案根目錄的 `.node-version` 檔案（已包含在專案中）。

### 步驟 4：設定環境變數

在 Heroku 後台 → Settings → Config Vars，或使用 CLI 設定以下環境變數：

```bash
# 資料庫連線字串（必填）
heroku config:set DATABASE_URL="mysql://user:password@host/dbname?ssl=true"

# JWT 密鑰（必填，請使用隨機長字串）
heroku config:set JWT_SECRET="your-super-secret-random-string-at-least-32-chars"

# Node 環境
heroku config:set NODE_ENV="production"

# S3 / Cloudflare R2 設定（用於證件圖片儲存）
heroku config:set AWS_ACCESS_KEY_ID="your-access-key"
heroku config:set AWS_SECRET_ACCESS_KEY="your-secret-key"
heroku config:set AWS_REGION="ap-northeast-1"
heroku config:set AWS_S3_BUCKET="your-bucket-name"
# 如果使用 Cloudflare R2，還需要設定：
heroku config:set AWS_ENDPOINT_URL="https://your-account-id.r2.cloudflarestorage.com"
```

### 步驟 5：設定 pnpm buildpack

Heroku 預設使用 npm，需要手動加入 pnpm 支援：

```bash
heroku buildpacks:add --index 1 https://github.com/unfold/heroku-buildpack-pnpm
```

### 步驟 6：部署程式碼

```bash
# 在專案根目錄執行
cd /path/to/shandaidai

# 初始化 git（如果還沒有）
git init
git add .
git commit -m "Initial deployment"

# 推送到 Heroku
git push heroku main
```

### 步驟 7：初始化資料庫

部署完成後，執行資料庫遷移：

```bash
heroku run pnpm drizzle-kit migrate
```

或者直接在 PlanetScale / JawsDB 的 SQL 編輯器中執行 `drizzle/migrations/` 資料夾內的 `.sql` 檔案。

---

## 四、驗證部署

```bash
# 開啟網站
heroku open

# 查看日誌
heroku logs --tail
```

---

## 五、環境變數完整清單

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `DATABASE_URL` | MySQL 連線字串 | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Session 簽名密鑰 | `a1b2c3...`（32字元以上） |
| `NODE_ENV` | 執行環境 | `production` |
| `AWS_ACCESS_KEY_ID` | S3/R2 存取金鑰 | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | S3/R2 私密金鑰 | `wJalrXUtnFEMI/...` |
| `AWS_REGION` | S3 區域 | `ap-northeast-1` |
| `AWS_S3_BUCKET` | S3 儲存桶名稱 | `shandaidai-docs` |
| `AWS_ENDPOINT_URL` | R2 端點（選填） | `https://xxx.r2.cloudflarestorage.com` |

---

## 六、常見問題

**Q：部署後網站打開是空白的？**
A：執行 `heroku logs --tail` 查看錯誤，通常是環境變數未設定。

**Q：資料庫連線失敗？**
A：確認 `DATABASE_URL` 格式正確，PlanetScale 需要加上 `?ssl={"rejectUnauthorized":true}`。

**Q：圖片上傳失敗？**
A：確認 AWS S3 或 Cloudflare R2 的 Access Key 和 Bucket 名稱正確，並確認 Bucket 有開放寫入權限。

**Q：Heroku 每 30 分鐘睡眠？**
A：免費方案已停止，使用 Basic Dyno（$7/月）不會睡眠。

---

## 七、推薦架構（月費估算）

| 服務 | 方案 | 月費 |
|------|------|------|
| Heroku Basic Dyno | 1 個 Web Dyno | $7 |
| PlanetScale Hobby | MySQL 資料庫 | 免費 |
| Cloudflare R2 | 圖片儲存 | 免費（10GB 內） |
| **合計** | | **約 $7/月** |

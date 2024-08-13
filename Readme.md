# 記錄 Telegram Bot API 一些小功能(查看有沒有加入頻道與用戶照片)

## 前置準備

在開始實作之前，你需要確保已經安裝以下工具和程式庫：

### 工具

- **Node.js**：確保你的系統上已經安裝了 Node.js（建議使用最新版）。
- **npm 或 Yarn**：Node.js 的包管理工具，用於安裝所需的程式庫。

### 必要程式庫

請使用以下指令來安裝所需的 npm 套件：

```bash
npm install express dotenv axios body-parser
```

## Backend

以下是完整的程式碼，展示了如何使用 Telegram Bot API 驗證用戶是否加入了特定的 Telegram 頻道，以及如何獲取用戶的頭像。

```javascript
// Import the required packages
import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import bodyParser from "body-parser";

// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();
app.use(bodyParser.json());

// Initialize auth client first
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // 頻道的 ID 或 @頻道名稱，private 頻道只能用 ID

// 檢查用戶是否加入 Telegram 頻道的路由
app.get("/checkJoinTgChannel", async (req, res) => {
  const { userId } = req.query; // 從查詢參數獲取用戶的 Telegram ID

  try {
    const { data } = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`,
      {
        params: {
          chat_id: TELEGRAM_CHANNEL_ID,
          user_id: userId,
        },
      }
    );
    console.log({ data });

    const memberStatus = data.result.status;
    const isMember = memberStatus !== "left";

    res.json({ isMember });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取用戶頭像的路由
app.get("/getUserPhoto", async (req, res) => {
  const { telegramId } = req.query; // 從查詢參數獲取用戶的 Telegram ID
  console.log("telegramId", telegramId);
  try {
    const photoId = await getUserProfilePhotos("telegramId");
    console.log("photoId", photoId);
    if (photoId) {
      const photoUrl = await downloadUserProfilePhoto(photoId);
      console.log("photoUrl", photoUrl);
      res.json({ photoUrl });
    } else {
      res.json({ photoUrl: null });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取用戶頭像的輔助函數
async function getUserProfilePhotos(userId) {
  try {
    const { data } = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUserProfilePhotos`,
      {
        params: {
          user_id: userId,
          limit: 1, // 拿到最新的頭貼
        },
      }
    );
    console.log(data);

    if (data.ok && data.result.total_count > 0) {
      const photo = data.result.photos[0][0]; // 拿到第一個頭像的第一個版本
      return photo.file_id;
    } else {
      console.log("No profile photo found for user:", userId);
      return null;
    }
  } catch (error) {
    console.log("Error fetching user profile photo:", error);
    return null;
  }
}

// 下載用戶頭像的輔助函數
async function downloadUserProfilePhoto(fileId) {
  try {
    const { data } = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile`,
      {
        params: {
          file_id: fileId,
        },
      }
    );

    if (data.ok) {
      const filePath = data.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

      return fileUrl;
    } else {
      console.log("Error fetching file path:", data);
      return null;
    }
  } catch (error) {
    console.log("Error downloading user profile photo:", error);
    return null;
  }
}

// Start the Express application
app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
```

### 說明

1. **authClient 設置**：

   - 在程式碼中，我們首先加載了環境變數（dotenv.config()），這樣我們可以安全地使用環境變數來儲存敏感資訊，例如 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHANNEL_ID。

2. **檢查用戶是否加入 Telegram 頻道**：

   - 使用 /checkJoinTgChannel 路由來檢查用戶是否已加入特定的 Telegram 頻道。這是通過 getChatMember Telegram API 完成的，如果用戶狀態不是 left，則表示用戶已加入。

3. **獲取用戶頭像**：

   - 使用 /getUserPhoto 路由來獲取用戶的 Telegram 頭像。我們通過 getUserProfilePhotos API 獲取用戶的頭像 ID，然後使用 getFile API 下載頭像並返回其 URL。

4. **錯誤處理**：
   - 在每個 API 請求中，我們都進行了錯誤處理，如果請求失敗，伺服器會返回適當的錯誤訊息，並在控制台中記錄錯誤詳情。

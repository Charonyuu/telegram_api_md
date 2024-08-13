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
// 頻道的 ID 或 @頻道名稱
// private 只能用 頻道的 ID
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; //


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

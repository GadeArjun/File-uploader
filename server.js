const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🟢 MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB (FileFuse)"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 🟢 Define Mongoose Schemas
const userSchema = new mongoose.Schema({
  username: String,
  password: String, // In production, hash passwords.
});

const fileMetadataSchema = new mongoose.Schema({
  originalname: String,
  mimetype: String,
  size: Number,
  uploader: String,
  telegramFileId: String,
  url: String,
  uploadDate: { type: Date, default: Date.now },
});

// 🟢 Define Mongoose Models
const User = mongoose.model("User", userSchema);
const FileMetadata = mongoose.model("FileMetadata", fileMetadataSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Increase body size limit
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// 🟢 Telegram Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// 🟢 Multer Configuration: Files Stored in Memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

// Serve static files
app.use(express.static("public"));

// 🟢 Signup Route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const newUser = new User({ username, password });
  await newUser.save();
  res.json({ message: "User registered successfully" });
});

// 🟢 Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ message: "Login successful", username });
});

// 🟢 Upload Endpoint (local storage, Telegram, 1-minute delay before deletion)

// 🟢 Upload Endpoint (local storage, Telegram, 1-minute delay before deletion)
app.post("/upload", upload.array("files", 10), async (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: "User not provided" });
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  const uploadedMeta = [];
  const skippedFiles = [];

  // Define local upload directory.
  const UPLOAD_DIR = path.join(__dirname, "uploads");
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
  }

  try {
    // Process files sequentially.
    for (const file of req.files) {
      console.log(`Processing: ${file.originalname}, Size: ${file.size} bytes`);

      // Skip file if size exceeds 50 MB.
      if (file.size > 50 * 1024 * 1024) {
        skippedFiles.push({
          originalname: file.originalname,
          reason: "File exceeds 50MB limit",
        });
        console.log(`File ${file.originalname} exceeds 50MB limit, skipping.`);
        continue;
      }

      // Save file locally.
      const localFileName = Date.now() + "-" + file.originalname;
      const localFilePath = path.join(UPLOAD_DIR, localFileName);
      try {
        await fs.promises.writeFile(localFilePath, file.buffer);
        console.log(`Saved file locally: ${localFilePath}`);
      } catch (writeErr) {
        skippedFiles.push({
          originalname: file.originalname,
          reason: "Local storage failed",
        });
        console.error(`Error saving ${file.originalname}:`, writeErr);
        continue;
      }

      // Determine file extension.
      const extension = file.originalname.split(".").pop().toLowerCase();
      let sentMessage;
      try {
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
          // Send as a photo.
          
          sentMessage = await bot.sendPhoto(
            TELEGRAM_CHAT_ID,
            localFilePath,
            // fs.createReadStream(localFilePath),
            {}, // options
            { filename: file.originalname } // fileOptions
          );
        } else if (["mp4", "mkv", "avi", "mov", "wmv", "flv"].includes(extension)) {
          // Send as a video.
          sentMessage = await bot.sendVideo(
            TELEGRAM_CHAT_ID,
            localFilePath,
            {},
            { filename: file.originalname }
          );
        } else if (["mp3", "aac", "ogg", "wma"].includes(extension)) {
          // Send as an audio file.
          sentMessage = await bot.sendAudio(
            TELEGRAM_CHAT_ID,
            fs.createReadStream(localFilePath),
            {},
            { filename: file.originalname }
          );
        } else {
          // Send as a document.
          sentMessage = await bot.sendDocument(
            TELEGRAM_CHAT_ID,
            fs.createReadStream(localFilePath),
            {},
            { filename: file.originalname, contentType: file.mimetype }
          );
        }
      } catch (err) {
        skippedFiles.push({
          originalname: file.originalname,
          reason: "Failed to send to Telegram",
        });
        console.error(`Error sending ${file.originalname} to Telegram:`, err);
        await fs.promises.unlink(localFilePath).catch((err) =>
          console.error(`Error deleting ${localFilePath}:`, err)
        );
        continue;
      }

      // Extract file_id based on response type.
      let fileId;
      if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
        // For photos, Telegram returns a 'photo' array; choose the highest resolution.
        if (sentMessage.photo && sentMessage.photo.length > 0) {
          fileId = sentMessage.photo[sentMessage.photo.length - 1].file_id;
        }
      } else if (["mp4", "mkv", "avi", "mov", "wmv", "flv"].includes(extension)) {
        if (sentMessage.video) {
          fileId = sentMessage.video.file_id;
        }
      } else if (["mp3", "aac", "ogg", "wma"].includes(extension)) {
        if (sentMessage.audio) {
          fileId = sentMessage.audio.file_id;
        }
      } else {
        if (sentMessage.document) {
          fileId = sentMessage.document.file_id;
        }
      }

      if (!fileId) {
        skippedFiles.push({
          originalname: file.originalname,
          reason: "Telegram response invalid",
        });
        console.error(`Invalid Telegram response for ${file.originalname}`);
        await fs.promises.unlink(localFilePath).catch((err) =>
          console.error(`Error deleting ${localFilePath}:`, err)
        );
        continue;
      }

      // Retrieve file details from Telegram.
      const fileInfo = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

      // Create metadata for the file and save it to MongoDB.
      const fileMetadata = new FileMetadata({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploader: user,
        telegramFileId: fileId,
        url: fileUrl,
      });
      await fileMetadata.save();
      uploadedMeta.push(fileMetadata);

      // Wait 1 minute (60000 ms) before deleting the local file.
      await new Promise((resolve) => setTimeout(resolve, 60000));

      try {
        await fs.promises.unlink(localFilePath);
        console.log(`Deleted local file: ${localFilePath}`);
      } catch (delErr) {
        console.error(`Error deleting ${localFilePath}:`, delErr);
      }
    }

    res.json({
      message: "Upload complete.",
      uploaded: uploadedMeta,
      skipped: skippedFiles,
    });
  } catch (err) {
    console.error("Error uploading files to Telegram:", err);
    res.status(500).json({ error: "Upload failed." });
  }
});





// 🟢 Get Images Endpoint (Uses MongoDB with Mongoose)
app.get("/images", async (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: "User not provided" });

  try {
    let query = { uploader: user };
    if (req.query.query) {
      query.originalname = { $regex: req.query.query, $options: "i" };
    }
    const sortOptions = {
      date_desc: { uploadDate: -1 },
      date_asc: { uploadDate: 1 },
      name_asc: { originalname: 1 },
      name_desc: { originalname: -1 },
    };
    const sortBy = sortOptions[req.query.sort] || {};
    const files = await FileMetadata.find(query).sort(sortBy);
    res.json({ images: files });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images." });
  }
});

// 🟢 Delete Image Endpoint (Uses MongoDB with Mongoose)
app.delete("/image", async (req, res) => {
  try {
    const user = req.query.user;
    if (!user) return res.status(400).json({ error: "User not provided" });

    const { id } = req.body;
    const file = await FileMetadata.findById(id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    if (file.uploader !== user) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this file" });
    }
    await FileMetadata.deleteOne({ _id: id });
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file." });
  }
});

// 🟢 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

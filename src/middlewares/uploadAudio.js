import multer from "multer";
import fs from "fs";
import path from "path";

// استخدم مسار مطلق من جذر المشروع
const uploadPath = path.join(process.cwd(), "uploads", "audios");

// تأكد إن المجلد موجود أو أنشئه
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/aac",
    "audio/mp4",
    "audio/x-wav",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported audio format"), false);
  }
};

console.log("📦 Upload middleware loaded");

export const uploadAudio = multer({ storage, fileFilter });

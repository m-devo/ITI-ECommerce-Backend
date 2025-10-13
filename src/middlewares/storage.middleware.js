import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    if (file.fieldname === "book") {
      if (file.mimetype !== "application/pdf") {
        return cb(new ApiError(400, "Book must be a PDF file"));
      }
    } else if (file.fieldname === "image") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new ApiError(400, "Image must be an image file"));
      }
    } else {
      return cb(new ApiError(400, "Unknown file field, must be pdf and image"));
    }

    cb(null, true);
  } catch (err) {
    cb(err);
  }
};

const upload = multer({ storage, fileFilter });

const upload_field = (req, res, next) => {
  const handler = upload.fields([
    { name: "book", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]);

  handler(req, res, (err) => {
    if (err) {
      return res.status(err.statusCode || 400).json({
        statusCode: err.statusCode || 400,
        success: false,
        message: err.message || "File upload error"
      });
    }
    next();
  });
};

const validateAndSaveFiles = (req, res, next) => {
  try {
    const imageFile = req.files?.image?.[0];
    const bookFile = req.files?.book?.[0];
     if (!imageFile) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Image file is required"
      });
    }
     if (!bookFile) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Book file is required"
      });
    }

    if (!imageFile || !bookFile) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Both image and book files are required"
      });
    }

    const saveFile = (buffer, folder, originalname) => {
      fs.mkdirSync(folder, { recursive: true });
      const cleanName = originalname.replace(/\s+/g, "_");
      const filename = `${Date.now()}-${cleanName}`;
      const filePath = path.join(folder, filename);
      fs.writeFileSync(filePath, buffer);
      return filePath;
    };

    const imagePath = saveFile(imageFile.buffer, "public/images", imageFile.originalname);
    const bookPath = saveFile(bookFile.buffer, "uploads/books", bookFile.originalname);

    req.savedFiles = { imagePath, bookPath };
    next();
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: err.message || "Error saving files"
    });
  }
};

export { upload_field, validateAndSaveFiles };
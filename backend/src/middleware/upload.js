// src/middleware/upload.js
const multer = require("multer");
const path = require("path");
const { AppError } = require("./errorHandler");

const ALLOWED_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/msword": "DOCX",
  "application/vnd.ms-excel": "XLSX",
};

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Use memory storage (files go to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = ALLOWED_TYPES[file.mimetype];

  if (!ALLOWED_EXTENSIONS.includes(ext) || !mimeType) {
    return cb(
      new AppError(
        "Invalid file type. Only PDF, Word (.docx), and Excel (.xlsx) files are allowed.",
        400
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Middleware to add fileType to req
const processUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file.", 400));
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if ([".pdf"].includes(ext)) req.fileType = "PDF";
  else if ([".docx", ".doc"].includes(ext)) req.fileType = "DOCX";
  else if ([".xlsx", ".xls"].includes(ext)) req.fileType = "XLSX";

  next();
};

module.exports = { upload, processUpload };

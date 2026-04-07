// cloudinary.service.js
// Cloudinary bo'lsa - cloud'ga, bo'lmasa - lokalga saqlaydi
const fs   = require("fs");
const path = require("path");

const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary;
if (USE_CLOUDINARY) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ===== LOKAL SAQLASH =====
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!USE_CLOUDINARY && !fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ===== CLOUDINARY UPLOAD =====
const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const publicId = `edutest/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const stream   = cloudinary.uploader.upload_stream(
      { resource_type: "raw", public_id: publicId, overwrite: false },
      (err, result) => {
        if (err) return reject(new Error("Cloudinary yuklashda xatolik: " + err.message));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// ===== LOKAL UPLOAD =====
const uploadToLocal = (buffer, originalName) => {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return { url: `${base}/uploads/${fileName}`, publicId: fileName };
};

// ===== MAIN UPLOAD =====
const uploadFile = async (buffer, originalName) => {
  if (USE_CLOUDINARY) {
    return uploadToCloudinary(buffer, originalName);
  }
  return uploadToLocal(buffer, originalName);
};

// ===== DELETE =====
const deleteFile = async (publicId) => {
  try {
    if (USE_CLOUDINARY) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } else {
      const filePath = path.join(UPLOADS_DIR, publicId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error("Fayl o'chirishda xatolik:", e.message);
  }
};

console.log(`📁 Fayl saqlash: ${USE_CLOUDINARY ? "Cloudinary ☁️" : "Lokal 💾"}`);

module.exports = { uploadFile, deleteFile };

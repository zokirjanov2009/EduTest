require("dotenv").config();
require("express-async-errors");

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const path       = require("path");

const authRoutes    = require("./routes/auth.routes");
const adminRoutes   = require("./routes/admin.routes");
const teacherRoutes = require("./routes/teacher.routes");
const studentRoutes = require("./routes/student.routes");
const errorHandler  = require("./middleware/errorHandler");
const { notFound }  = require("./middleware/errorHandler");

const app = express();

// Railway / proxy uchun
app.set("trust proxy", 1);

// ===== CORS =====
const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:3000";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
};

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // health check / server-to-server
    if (getAllowedOrigins().includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: ${origin} ruxsat etilmagan`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ===== SECURITY =====
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ===== RATE LIMITING =====
app.use("/api", rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Juda ko'p so'rov. Biroz kuting." },
}));

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Juda ko'p urinish. Biroz kuting." },
}));

// ===== BODY PARSING =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== LOGGING =====
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ===== STATIC FILES (lokal upload uchun) =====
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
  res.json({ success: true, message: "EduTest API ishlayapti!", env: process.env.NODE_ENV });
});
app.get("/", (req, res) => {
  res.json({ success: true, message: "EduTest API" });
});

// ===== ROUTES =====
app.use("/api/auth",    authRoutes);
app.use("/api/admin",   adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

// ===== ERRORS =====
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 EduTest backend: http://0.0.0.0:${PORT}`);
  console.log(`📌 Muhit: ${process.env.NODE_ENV}`);
});

module.exports = app;

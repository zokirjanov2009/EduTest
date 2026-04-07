const bcrypt = require("bcryptjs");
const { z }  = require("zod");
const prisma = require("../config/prisma");
const { generateTokens, verifyToken } = require("../utils/jwt");
const { successResponse, errorResponse } = require("../utils/response");

// ===== LOGIN =====
const login = async (req, res) => {
  const { email, password } = z.object({
    email:    z.string().email("Email noto'g'ri"),
    password: z.string().min(1, "Parol kiritilmagan"),
  }).parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true, name: true, email: true, password: true,
      role: true, subject: true, groups: true, group: true, isActive: true,
    },
  });

  if (!user)        return errorResponse(res, "Email yoki parol noto'g'ri.", 401);
  if (!user.isActive) return errorResponse(res, "Akkauntingiz bloklangan. Admin bilan bog'laning.", 403);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return errorResponse(res, "Email yoki parol noto'g'ri.", 401);

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  const { password: _, ...safeUser } = user;

  return successResponse(res, { user: safeUser, accessToken, refreshToken }, "Muvaffaqiyatli kirdingiz");
};

// ===== GET ME =====
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, role: true,
      subject: true, groups: true, group: true,
      isActive: true, createdAt: true,
    },
  });
  if (!user) return errorResponse(res, "Foydalanuvchi topilmadi.", 404);
  return successResponse(res, { user }, "Profil ma'lumotlari");
};

// ===== REFRESH TOKEN =====
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return errorResponse(res, "Refresh token kiritilmagan.", 400);

  const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
  if (!decoded) return errorResponse(res, "Token yaroqsiz yoki muddati tugagan.", 401);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!user?.isActive) return errorResponse(res, "Foydalanuvchi topilmadi.", 401);

  const tokens = generateTokens(user.id, user.role);
  return successResponse(res, tokens, "Token yangilandi");
};

// ===== CHANGE PASSWORD =====
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(6, "Yangi parol kamida 6 belgi"),
  }).parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true },
  });

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return errorResponse(res, "Joriy parol noto'g'ri.", 400);

  await prisma.user.update({
    where: { id: req.user.id },
    data:  { password: await bcrypt.hash(newPassword, 12) },
  });
  return successResponse(res, null, "Parol muvaffaqiyatli o'zgartirildi");
};

module.exports = { login, getMe, refreshToken, changePassword };

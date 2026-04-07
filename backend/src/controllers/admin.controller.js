const bcrypt = require("bcryptjs");
const { z }  = require("zod");
const prisma  = require("../config/prisma");
const { successResponse, errorResponse, paginatedResponse } = require("../utils/response");

// ===== CREATE TEACHER =====
// Admin fan nomi va boshqaradigan guruhlarni kiritadi
const createTeacher = async (req, res) => {
  const schema = z.object({
    name:     z.string().min(2, "Ism kamida 2 belgi"),
    email:    z.string().email("Email noto'g'ri"),
    password: z.string().min(6, "Parol kamida 6 belgi"),
    subject:  z.string().min(1, "Fan nomi kiritilishi shart"),
    groups:   z.array(z.string().min(1)).min(1, "Kamida 1 ta guruh kiritilishi shart"),
  });

  const { name, email, password, subject, groups } = schema.parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (exists) return errorResponse(res, "Bu email allaqachon ishlatilgan.", 409);

  const teacher = await prisma.user.create({
    data: {
      name,
      email:    email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12),
      role:     "TEACHER",
      subject,
      groups,
      createdById: req.user.id,
    },
    select: {
      id: true, name: true, email: true,
      subject: true, groups: true,
      role: true, isActive: true, createdAt: true,
    },
  });

  return successResponse(res, { teacher }, "O'qituvchi muvaffaqiyatli yaratildi", 201);
};

// ===== GET ALL TEACHERS =====
const getTeachers = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const skip   = (page - 1) * limit;

  const where = {
    role: "TEACHER",
    ...(search && {
      OR: [
        { name:    { contains: search, mode: "insensitive" } },
        { email:   { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [teachers, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      select: {
        id: true, name: true, email: true,
        subject: true, groups: true,
        isActive: true, createdAt: true,
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(res, { teachers },
    { total, page, limit, totalPages: Math.ceil(total / limit) },
    "O'qituvchilar ro'yxati");
};

// ===== GET ALL STUDENTS =====
const getStudents = async (req, res) => {
  const page      = parseInt(req.query.page)  || 1;
  const limit     = parseInt(req.query.limit) || 10;
  const search    = req.query.search    || "";
  const teacherId = req.query.teacherId || undefined;
  const group     = req.query.group     || undefined;
  const skip      = (page - 1) * limit;

  const where = {
    role: "STUDENT",
    ...(teacherId && { teacherId }),
    ...(group     && { group }),
    ...(search && {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      select: {
        id: true, name: true, email: true, group: true,
        isActive: true, createdAt: true,
        teacher: { select: { id: true, name: true, subject: true, groups: true } },
        _count:  { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(res, { students },
    { total, page, limit, totalPages: Math.ceil(total / limit) },
    "Talabalar ro'yxati");
};

// ===== TOGGLE USER STATUS =====
const toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id)
    return errorResponse(res, "O'z akkauntingizni bloklashingiz mumkin emas.", 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(res, "Foydalanuvchi topilmadi.", 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true },
  });

  return successResponse(res, { user: updated },
    `Foydalanuvchi ${updated.isActive ? "faollashtirildi" : "bloklandi"}`);
};

// ===== DELETE USER =====
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id)
    return errorResponse(res, "O'z akkauntingizni o'chirishingiz mumkin emas.", 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(res, "Foydalanuvchi topilmadi.", 404);

  await prisma.user.delete({ where: { id: userId } });
  return successResponse(res, null, "Foydalanuvchi o'chirildi");
};

// ===== RESET PASSWORD =====
const resetUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = z.object({
    newPassword: z.string().min(6),
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(res, "Foydalanuvchi topilmadi.", 404);

  await prisma.user.update({
    where: { id: userId },
    data:  { password: await bcrypt.hash(newPassword, 12) },
  });

  return successResponse(res, null, "Parol muvaffaqiyatli yangilandi");
};

// ===== UPDATE USER =====
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const schema = z.object({
    name:    z.string().min(2).optional(),
    subject: z.string().min(1).optional(),
    groups:  z.array(z.string().min(1)).optional(),
  });

  const data = schema.parse(req.body);
  const user  = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(res, "Foydalanuvchi topilmadi.", 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, subject: true, groups: true, role: true, isActive: true },
  });

  return successResponse(res, { user: updated }, "Ma'lumotlar yangilandi");
};

// ===== DASHBOARD STATS =====
const getDashboardStats = async (req, res) => {
  const [
    totalTeachers, totalStudents, totalSubmissions,
    totalGradedSubmissions, recentSubmissions, gradeDistribution,
    subjects,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "GRADED" } }),
    prisma.submission.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, status: true, createdAt: true,
        student: { select: { name: true, group: true } },
      },
    }),
    prisma.gradeReport.groupBy({
      by: ["gradeNumber"], _count: { gradeNumber: true },
    }),
    // Fanlar bo'yicha o'qituvchilar soni
    prisma.user.groupBy({
      by: ["subject"],
      where: { role: "TEACHER", subject: { not: null } },
      _count: { subject: true },
    }),
  ]);

  return successResponse(res, {
    stats: {
      totalTeachers, totalStudents, totalSubmissions,
      totalGradedSubmissions,
      pendingSubmissions: totalSubmissions - totalGradedSubmissions,
      recentSubmissions,
      gradeDistribution: gradeDistribution.reduce((acc, i) => {
        acc[i.gradeNumber] = i._count.gradeNumber; return acc;
      }, {}),
      subjects: subjects.map(s => ({ name: s.subject, count: s._count.subject })),
    },
  }, "Dashboard statistikasi");
};

module.exports = {
  createTeacher, getTeachers, getStudents,
  toggleUserStatus, deleteUser, resetUserPassword,
  updateUser, getDashboardStats,
};

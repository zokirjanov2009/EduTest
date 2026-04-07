const bcrypt = require("bcryptjs");
const { z }  = require("zod");
const prisma  = require("../config/prisma");
const { successResponse, errorResponse, paginatedResponse } = require("../utils/response");

// ===== TEACHER INFO HELPER =====
const getTeacherGroups = async (teacherId) => {
  const t = await prisma.user.findUnique({
    where:  { id: teacherId },
    select: { groups: true, subject: true },
  });
  return t;
};

// ===== CREATE STUDENT =====
// Teacher student yaratganda guruh nomini kiritadi
// Lekin faqat o'z guruhlariga qo'sha oladi
const createStudent = async (req, res) => {
  const schema = z.object({
    name:     z.string().min(2),
    email:    z.string().email(),
    password: z.string().min(6),
    group:    z.string().min(1, "Guruh nomi kiritilishi shart"),
  });

  const { name, email, password, group } = schema.parse(req.body);

  // Teacher o'z guruhlaridan birini kiritishi kerak
  const teacher = await getTeacherGroups(req.user.id);
  if (teacher.groups.length > 0 && !teacher.groups.includes(group)) {
    return errorResponse(res,
      `Siz faqat quyidagi guruhlardan biriga talaba qo'sha olasiz: ${teacher.groups.join(", ")}`,
      403);
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (exists) return errorResponse(res, "Bu email allaqachon ishlatilgan.", 409);

  const student = await prisma.user.create({
    data: {
      name,
      email:       email.toLowerCase().trim(),
      password:    await bcrypt.hash(password, 12),
      role:        "STUDENT",
      group,
      teacherId:   req.user.id,
      createdById: req.user.id,
    },
    select: {
      id: true, name: true, email: true, group: true,
      role: true, isActive: true, createdAt: true,
    },
  });

  return successResponse(res, { student }, "Talaba muvaffaqiyatli yaratildi", 201);
};

// ===== GET MY STUDENTS =====
// Faqat o'z guruhlaridagi talabalar
const getMyStudents = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const search = req.query.search || "";
  const filterGroup = req.query.group || "";
  const skip   = (page - 1) * limit;

  const teacher = await getTeacherGroups(req.user.id);

  // Teacher o'z guruhlaridagi yoki bevosita qo'shgan talabalarni ko'radi
  const where = {
    role:      "STUDENT",
    teacherId: req.user.id,  // Faqat bu teacher qo'shgan talabalar
    ...(filterGroup && { group: filterGroup }),
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
        _count: { select: { submissions: true } },
        gradeReports: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { gradeNumber: true, percentage: true },
        },
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(res, {
    students,
    teacherGroups: teacher.groups,
    teacherSubject: teacher.subject,
  },
    { total, page, limit, totalPages: Math.ceil(total / limit) },
    "Talabalar ro'yxati");
};

// ===== GET GRADES =====
const getStudentGrades = async (req, res) => {
  const page      = parseInt(req.query.page)  || 1;
  const limit     = parseInt(req.query.limit) || 20;
  const studentId = req.query.studentId;
  const group     = req.query.group;
  const skip      = (page - 1) * limit;

  const where = {
    student: { teacherId: req.user.id },
    ...(studentId && { studentId }),
    ...(group && { student: { teacherId: req.user.id, group } }),
  };

  const [grades, total] = await Promise.all([
    prisma.gradeReport.findMany({
      where, skip, take: limit,
      select: {
        id: true, grade: true, gradeNumber: true, percentage: true,
        aiSummary: true, createdAt: true,
        student:    { select: { id: true, name: true, email: true, group: true } },
        submission: { select: { id: true, title: true, fileType: true, fileName: true } },
        testResult: { select: { score: true, answers: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gradeReport.count({ where }),
  ]);

  return paginatedResponse(res, { grades },
    { total, page, limit, totalPages: Math.ceil(total / limit) },
    "Baholar ro'yxati");
};

// ===== GET GRADE DETAIL =====
const getGradeDetail = async (req, res) => {
  const { gradeId } = req.params;

  const grade = await prisma.gradeReport.findFirst({
    where: { id: gradeId, student: { teacherId: req.user.id } },
    include: {
      student:    { select: { id: true, name: true, email: true, group: true } },
      submission: true,
      testResult: { include: { test: { select: { questions: true } } } },
    },
  });

  if (!grade) return errorResponse(res, "Baho topilmadi.", 404);
  return successResponse(res, { grade }, "Baho tafsiloti");
};

// ===== DASHBOARD STATS =====
const getDashboardStats = async (req, res) => {
  const teacherId = req.user.id;
  const teacher   = await getTeacherGroups(teacherId);

  const [
    totalStudents, totalSubmissions, gradedSubmissions,
    gradeDistribution, recentGrades, groupStats,
  ] = await Promise.all([
    prisma.user.count({ where: { teacherId, role: "STUDENT" } }),
    prisma.submission.count({ where: { student: { teacherId } } }),
    prisma.submission.count({ where: { status: "GRADED", student: { teacherId } } }),
    prisma.gradeReport.groupBy({
      by: ["gradeNumber"],
      where: { student: { teacherId } },
      _count: { gradeNumber: true },
    }),
    prisma.gradeReport.findMany({
      where: { student: { teacherId } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        gradeNumber: true, percentage: true, createdAt: true,
        student:    { select: { name: true, group: true } },
        submission: { select: { title: true } },
      },
    }),
    // Guruh bo'yicha talabalar soni
    prisma.user.groupBy({
      by: ["group"],
      where: { teacherId, role: "STUDENT", group: { not: null } },
      _count: { group: true },
    }),
  ]);

  return successResponse(res, {
    stats: {
      subject:  teacher.subject,
      groups:   teacher.groups,
      totalStudents, totalSubmissions, gradedSubmissions,
      pendingSubmissions: totalSubmissions - gradedSubmissions,
      gradeDistribution: gradeDistribution.reduce((acc, i) => {
        acc[i.gradeNumber] = i._count.gradeNumber; return acc;
      }, {}),
      recentGrades,
      groupStats: groupStats.map(g => ({ group: g.group, count: g._count.group })),
    },
  }, "Dashboard statistikasi");
};

// ===== TOGGLE STUDENT STATUS =====
const toggleStudentStatus = async (req, res) => {
  const { studentId } = req.params;

  const student = await prisma.user.findFirst({
    where: { id: studentId, teacherId: req.user.id, role: "STUDENT" },
  });

  if (!student) return errorResponse(res, "Talaba topilmadi.", 404);

  const updated = await prisma.user.update({
    where: { id: studentId },
    data:  { isActive: !student.isActive },
    select: { id: true, name: true, isActive: true },
  });

  return successResponse(res, { student: updated },
    `Talaba ${updated.isActive ? "faollashtirildi" : "bloklandi"}`);
};

// ===== DELETE STUDENT =====
const deleteStudent = async (req, res) => {
  const { studentId } = req.params;

  const student = await prisma.user.findFirst({
    where: { id: studentId, teacherId: req.user.id, role: "STUDENT" },
  });

  if (!student) return errorResponse(res, "Talaba topilmadi.", 404);
  await prisma.user.delete({ where: { id: studentId } });
  return successResponse(res, null, "Talaba o'chirildi");
};

module.exports = {
  createStudent, getMyStudents, getStudentGrades,
  getGradeDetail, getDashboardStats,
  toggleStudentStatus, deleteStudent,
};

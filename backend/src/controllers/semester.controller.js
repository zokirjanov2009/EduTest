const { z } = require("zod");
const prisma = require("../config/prisma");
const { successResponse, errorResponse } = require("../utils/response");

// ===== CREATE SEMESTER =====
const createSemester = async (req, res) => {
  const schema = z.object({
    name:       z.string().min(2),
    groupName:  z.string().min(1),
    subject:    z.string().min(1),
    deadline:   z.string().datetime({ offset: true }).or(z.string().min(1)),
    maxUploads: z.number().int().min(1).max(5).default(2),
  });

  const data = schema.parse(req.body);

  // Teacher faqat o'z guruhlariga semester yarata oladi
  const teacher = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { groups: true },
  });

  if (teacher.groups.length > 0 && !teacher.groups.includes(data.groupName)) {
    return errorResponse(res, `Siz faqat o'z guruhlaringizga semester yarata olasiz: ${teacher.groups.join(", ")}`, 403);
  }

  const semester = await prisma.semester.create({
    data: {
      ...data,
      deadline:  new Date(data.deadline),
      teacherId: req.user.id,
      status:    "ACTIVE",
    },
  });

  return successResponse(res, { semester }, "Semester yaratildi", 201);
};

// ===== GET SEMESTERS =====
const getSemesters = async (req, res) => {
  const group = req.query.group || undefined;

  const where = {
    teacherId: req.user.id,
    ...(group && { groupName: group }),
  };

  const semesters = await prisma.semester.findMany({
    where,
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(res, { semesters }, "Semesterlar ro'yxati");
};

// ===== UPDATE SEMESTER =====
const updateSemester = async (req, res) => {
  const { semesterId } = req.params;
  const schema = z.object({
    name:       z.string().min(2).optional(),
    deadline:   z.string().min(1).optional(),
    status:     z.enum(["PENDING","ACTIVE","FINISHED"]).optional(),
    maxUploads: z.number().int().min(1).max(5).optional(),
  });

  const data = schema.parse(req.body);

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, teacherId: req.user.id },
  });
  if (!semester) return errorResponse(res, "Semester topilmadi.", 404);

  const updated = await prisma.semester.update({
    where: { id: semesterId },
    data: {
      ...data,
      ...(data.deadline && { deadline: new Date(data.deadline) }),
    },
  });

  return successResponse(res, { semester: updated }, "Semester yangilandi");
};

// ===== DELETE SEMESTER =====
const deleteSemester = async (req, res) => {
  const { semesterId } = req.params;

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, teacherId: req.user.id },
  });
  if (!semester) return errorResponse(res, "Semester topilmadi.", 404);

  await prisma.semester.delete({ where: { id: semesterId } });
  return successResponse(res, null, "Semester o'chirildi");
};

// ===== ALLOW EXTRA ATTEMPT =====
const allowExtraAttempt = async (req, res) => {
  const { resultId } = req.params;

  const result = await prisma.testResult.findFirst({
    where: {
      id:      resultId,
      student: { teacherId: req.user.id },
    },
  });
  if (!result) return errorResponse(res, "Natija topilmadi.", 404);

  const updated = await prisma.testResult.update({
    where: { id: resultId },
    data:  { extraAllowed: true },
  });

  return successResponse(res, { result: updated }, "3-urinishga ruxsat berildi");
};

module.exports = { createSemester, getSemesters, updateSemester, deleteSemester, allowExtraAttempt };

// src/controllers/student.controller.js
const prisma = require("../config/prisma");
const { parseFile } = require("../services/file.service");
const { generateTests, gradeAnswers, generateFeedback } = require("../services/ai.service");
const { uploadFile } = require("../services/cloudinary.service");
const { successResponse, errorResponse, paginatedResponse } = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");

// ===== UPLOAD SUBMISSION =====
const uploadSubmission = async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim().length < 3)
    throw new AppError("Sarlavha kamida 3 belgi bo'lishi kerak.", 400);
  if (!req.file) throw new AppError("Fayl yuklanmadi.", 400);

  const fileType = req.fileType;
  const buffer = req.file.buffer;
  const originalName = req.file.originalname;

  // 1. Upload to Cloudinary
  const { url: fileUrl } = await uploadFile(buffer, originalName, fileType);

  // 2. Parse text from file
  let parsedData;
  try {
    parsedData = await parseFile(buffer, fileType);
  } catch (e) {
    throw new AppError(e.message, 400);
  }

  // 3. Save submission
  const submission = await prisma.submission.create({
    data: {
      title: title.trim(),
      fileUrl,
      fileType,
      fileName: originalName,
      extractedText: parsedData.text,
      status: "PROCESSING",
      studentId: req.user.id,
    },
  });

  // 4. Generate AI questions
  let questions;
  try {
    questions = await generateTests(parsedData.text, title);
  } catch (e) {
    console.error("🔴 AI XATO TAFSILOTI:", e.message);  // ← QO'SHING
    console.error("🔴 STACK:", e.stack);                 // ← QO'SHING
    await prisma.submission.update({ where: { id: submission.id }, data: { status: "FAILED" } });
    throw new AppError("AI test yaratishda xatolik. Qayta urinib ko'ring.", 500);
  }

  // 5. Save test
  const test = await prisma.test.create({
    data: { submissionId: submission.id, questions },
  });

  await prisma.submission.update({ where: { id: submission.id }, data: { status: "TESTED" } });

  return successResponse(res, {
    submissionId: submission.id,
    testId: test.id,
    title: submission.title,
    fileType,
    wordCount: parsedData.wordCount,
  }, "Fayl yuklandi va testlar tayyor!", 201);
};

// ===== GET TEST QUESTIONS (correct answers hidden) =====
const getTestQuestions = async (req, res) => {
  const { testId } = req.params;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      submission: { select: { studentId: true, title: true } },
      results: { where: { studentId: req.user.id }, select: { id: true } },
    },
  });

  if (!test) return errorResponse(res, "Test topilmadi.", 404);
  if (test.submission.studentId !== req.user.id)
    return errorResponse(res, "Bu test sizga tegishli emas.", 403);
  if (test.results.length > 0)
    return errorResponse(res, "Siz bu testni allaqachon topshirgansiz.", 400);

  // Strip correct answers before sending
  const safeQuestions = test.questions.map((q, i) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
  }));

  return successResponse(res, {
    testId: test.id,
    submissionTitle: test.submission.title,
    questions: safeQuestions,
    totalQuestions: safeQuestions.length,
  }, "Test savollar yuklandi");
};

// ===== SUBMIT TEST ANSWERS =====
const submitTestAnswers = async (req, res) => {
  const { testId } = req.params;
  const { answers } = req.body; // [{questionIndex: 0, selectedAnswer: "A"}, ...]

  if (!answers || !Array.isArray(answers) || answers.length !== 5)
    throw new AppError("5 ta savolga ham javob bering.", 400);

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      submission: { select: { studentId: true, extractedText: true } },
      results: { where: { studentId: req.user.id }, select: { id: true } },
    },
  });

  if (!test) return errorResponse(res, "Test topilmadi.", 404);
  if (test.submission.studentId !== req.user.id)
    return errorResponse(res, "Bu test sizga tegishli emas.", 403);
  if (test.results.length > 0)
    return errorResponse(res, "Siz bu testni allaqachon topshirgansiz.", 400);

  // Grade answers
  const { correctCount, percentage, grade, gradeNumber, results } =
    await gradeAnswers(test.questions, answers);

  // Generate AI feedback
  let feedback = "";
  try {
    feedback = await generateFeedback(
      test.submission.extractedText,
      correctCount,
      percentage,
      results
    );
  } catch (e) {
    feedback = `${correctCount}/5 to'g'ri javob. Foiz: ${percentage}%`;
  }

  // Save test result
  const testResult = await prisma.testResult.create({
    data: {
      testId,
      studentId: req.user.id,
      answers,
      score: correctCount,
      percentage,
      grade,
      gradeNumber,
      feedback,
    },
  });

  // Create grade report (visible to teacher)
  await prisma.gradeReport.create({
    data: {
      submissionId: test.submissionId,
      studentId: req.user.id,
      testResultId: testResult.id,
      grade,
      gradeNumber,
      percentage,
      aiSummary: feedback,
    },
  });

  // Update submission status
  await prisma.submission.update({
    where: { id: test.submissionId },
    data: { status: "GRADED" },
  });

  return successResponse(res, {
    score: correctCount,
    totalQuestions: 5,
    percentage,
    grade,
    gradeNumber,
    feedback,
    detailedResults: results,
  }, "Test natijasi saqlandi!");
};

// ===== GET MY SUBMISSIONS =====
const getMySubmissions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId: req.user.id },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        fileType: true,
        fileName: true,
        fileUrl: true,
        status: true,
        createdAt: true,
        tests: { select: { id: true } },
        gradeReport: {
          select: { gradeNumber: true, percentage: true, grade: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.count({ where: { studentId: req.user.id } }),
  ]);

  return paginatedResponse(res, { submissions },
    { total, page, limit, totalPages: Math.ceil(total / limit) },
    "Ishlar ro'yxati yuklandi");
};

// ===== GET SUBMISSION RESULT =====
const getSubmissionResult = async (req, res) => {
  const { submissionId } = req.params;

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, studentId: req.user.id },
    include: {
      tests: {
        include: {
          results: {
            where: { studentId: req.user.id },
            select: {
              score: true, percentage: true, grade: true,
              gradeNumber: true, feedback: true, answers: true, submittedAt: true,
            },
          },
        },
      },
      gradeReport: true,
    },
  });

  if (!submission) return errorResponse(res, "Topilmadi.", 404);

  return successResponse(res, { submission }, "Natija yuklandi");
};

// ===== GET DASHBOARD STATS =====
const getDashboardStats = async (req, res) => {
  const studentId = req.user.id;

  const [totalSubmissions, gradedSubmissions, avgGrade, recentSubmissions] = await Promise.all([
    prisma.submission.count({ where: { studentId } }),
    prisma.submission.count({ where: { studentId, status: "GRADED" } }),
    prisma.gradeReport.aggregate({
      where: { studentId },
      _avg: { gradeNumber: true, percentage: true },
    }),
    prisma.submission.findMany({
      where: { studentId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, status: true, fileType: true, createdAt: true,
        gradeReport: { select: { gradeNumber: true, percentage: true } },
      },
    }),
  ]);

  return successResponse(res, {
    stats: {
      totalSubmissions,
      gradedSubmissions,
      pendingSubmissions: totalSubmissions - gradedSubmissions,
      avgGrade: avgGrade._avg.gradeNumber?.toFixed(1) || null,
      avgPercentage: avgGrade._avg.percentage?.toFixed(1) || null,
      recentSubmissions,
    },
  }, "Dashboard ma'lumotlari yuklandi");
};

module.exports = {
  uploadSubmission,
  getTestQuestions,
  submitTestAnswers,
  getMySubmissions,
  getSubmissionResult,
  getDashboardStats,
};

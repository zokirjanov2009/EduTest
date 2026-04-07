const router = require("express").Router();
const {
  createStudent, getMyStudents, getStudentGrades,
  getGradeDetail, getDashboardStats, toggleStudentStatus, deleteStudent,
} = require("../controllers/teacher.controller");
const { isTeacher } = require("../middleware/auth");

router.use(isTeacher);

router.get("/dashboard", getDashboardStats);
router.post("/students", createStudent);
router.get("/students", getMyStudents);
router.patch("/students/:studentId/toggle", toggleStudentStatus);
router.delete("/students/:studentId", deleteStudent);
router.get("/grades", getStudentGrades);
router.get("/grades/:gradeId", getGradeDetail);

module.exports = router;

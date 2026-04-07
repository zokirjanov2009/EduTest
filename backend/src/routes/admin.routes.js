const router = require("express").Router();
const {
  createTeacher, getTeachers, getStudents,
  toggleUserStatus, deleteUser, resetUserPassword,
  updateUser, getDashboardStats,
} = require("../controllers/admin.controller");
const { isAdmin } = require("../middleware/auth");

router.use(isAdmin);

router.get("/dashboard", getDashboardStats);
router.post("/teachers", createTeacher);
router.get("/teachers", getTeachers);
router.get("/students", getStudents);
router.patch("/users/:userId/toggle", toggleUserStatus);
router.patch("/users/:userId/reset-password", resetUserPassword);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

module.exports = router;

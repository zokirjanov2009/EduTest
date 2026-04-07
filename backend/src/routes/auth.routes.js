// src/routes/auth.routes.js
const router = require("express").Router();
const { login, getMe, refreshToken, changePassword } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");

router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, changePassword);

module.exports = router;

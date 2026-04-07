// src/middleware/auth.js
const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");
const prisma = require("../config/prisma");

// ===== VERIFY JWT TOKEN =====
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Authentication required. Please login.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, "Invalid or expired token. Please login again.", 401);
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        teacherId: true,
      },
    });

    if (!user) {
      return errorResponse(res, "User not found.", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Your account has been deactivated. Contact admin.", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Authentication failed.", 401);
  }
};

// ===== ROLE-BASED ACCESS =====
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required.", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role: ${roles.join(" or ")}`,
        403
      );
    }

    next();
  };
};

// Shorthand middleware
const isAdmin = [authenticate, authorize("ADMIN")];
const isTeacher = [authenticate, authorize("TEACHER")];
const isStudent = [authenticate, authorize("STUDENT")];
const isAdminOrTeacher = [authenticate, authorize("ADMIN", "TEACHER")];

module.exports = { authenticate, authorize, isAdmin, isTeacher, isStudent, isAdminOrTeacher };

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post("/register", authController_1.register);
// router.post("/verify-otp", verifyOTP);
router.post("/login", authController_1.login);
router.post("/verify-otp-login", authController_1.verifyOTPAndLogin);
router.post("/refresh-token", authController_1.refreshToken);
// Google OAuth routes
router.get("/google", authController_1.googleAuth);
// The callback route must run passport.authenticate to process the OAuth response
router.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/api/auth/google/failure" }), authController_1.googleCallback);
router.get("/google/success", authController_1.googleAuthSuccess);
router.get("/google/failure", authController_1.googleAuthFailure);
// Protected routes
router.post("/logout", authController_1.logout);
router.post("/logout-all", authController_1.logoutAll);
// Test protected route
router.get("/profile", authMiddleware_1.verifyToken, (req, res) => {
    res.json({
        message: "Access granted",
        user: req.user,
    });
});
exports.default = router;

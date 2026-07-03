import express from "express";
import passport from "passport";
import {
  register,
  login,
  verifyOTP,
  verifyOTPAndLogin,
  refreshToken,
  logout,
  logoutAll,
  googleAuth,
  googleCallback,
  googleAuthSuccess,
  googleAuthFailure,
} from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/register", register);
// router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/verify-otp-login", verifyOTPAndLogin);
router.post("/refresh-token", refreshToken);

// Google OAuth routes
router.get("/google", googleAuth);
// The callback route must run passport.authenticate to process the OAuth response
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
  googleCallback
);
router.get("/google/success", googleAuthSuccess);
router.get("/google/failure", googleAuthFailure);

// Protected routes
router.post("/logout", logout);
router.post("/logout-all", logoutAll);

// Test protected route
router.get("/profile", verifyToken, (req: any, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});

export default router;

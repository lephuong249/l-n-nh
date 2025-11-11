import { Router } from "express";
import passport from "passport";
import AuthController from "../modules/auth/auth.controller.js";
import { googleConfig, facebookConfig } from "../config/auth.js";

const router = Router();

router.post("/register", AuthController.register);
router.get("/verify", AuthController.verifyEmail);
router.post("/login", AuthController.login);
router.post("/send-reset-password", AuthController.sendMailResetPassword);
router.get("/redirect-reset-password", AuthController.redirectResetPassword);
router.patch("/reset-password", AuthController.resetPassword);

// Login Google - only if configured
if (googleConfig) {
router.get("/google",passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res, next) => AuthController.googleCallback(req, res, next)
);
} else {
  router.get("/google", (req, res) => {
    res.status(503).json({ error: "Google OAuth not configured" });
  });
  router.get("/google/callback", (req, res) => {
    res.status(503).json({ error: "Google OAuth not configured" });
  });
}

// Login Facebook - only if configured
if (facebookConfig) {
router.get("/facebook", passport.authenticate("facebook", { scope: ["public_profile","email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {session: false, failureRedirect: "/login" }),
  (req, res, next) => AuthController.facebookCallback(req, res, next)
);
} else {
  router.get("/facebook", (req, res) => {
    res.status(503).json({ error: "Facebook OAuth not configured" });
  });
  router.get("/facebook/callback", (req, res) => {
    res.status(503).json({ error: "Facebook OAuth not configured" });
  });
}


export default router;

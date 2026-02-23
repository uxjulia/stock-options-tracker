import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/login", authRateLimiter, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);
router.put("/password", requireAuth, authController.changePassword);
router.post("/users", requireAuth, authController.createUser);
router.get("/users", requireAuth, authController.getUsers);
router.delete("/users/:id", requireAuth, authController.removeUser);
router.put(
  "/users/:id/password",
  requireAuth,
  authController.adminResetPassword
);

export default router;

import { Router } from "express";
import { register, login, logout, autoLogin } from "../controllers/authController.js";
const router = Router();

import {
  validateRegisterInput,
  validateLoginInput,
} from "../middleware/validationMiddleware.js";

router.post("/register", validateRegisterInput, register);
router.post("/login", validateLoginInput, login);
router.get("/logout", logout);
router.post("/auto-login", autoLogin);

export default router;

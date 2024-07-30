import { Router } from "express";
import {
  createResetSession,
  generateOTP,
  getUser,
  login,
  register,
  resetPassword,
  updateUser,
  verifyEmail,
  verifyOTP,
} from "../Controllers/AuthController.js";
import Auth, { localVariables } from "../Middlewares/auth.js";
import upload from "../Middlewares/upload.js";
import { registerMail } from "../Controllers/mailer.js";

const router = Router();

//POST Methods
router.post("/register", register);
router.post("/registerMail", registerMail);
router.post('/authenticate', verifyEmail, (req, res) => res.end());
router.post("/login", verifyEmail, login);

// PUT Methods
router.put("/updateuser", Auth, upload, updateUser);
router.put("/resetpassword", verifyEmail, resetPassword);

// GET Methods
router.get("/user/:email", getUser);
router.get("/generateOTP", generateOTP);
router.get("/verifyOTP", verifyOTP);
router.get("/createResetSession", createResetSession);

export default router;

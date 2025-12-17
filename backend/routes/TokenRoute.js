import express from "express";
import { requestPasswordReset, resetPassword } from "../controller/TokenController.js";


const router = express.Router();

// Password reset routes
router.post("/", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;
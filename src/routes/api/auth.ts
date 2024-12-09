import express from "express";
import authController from "../../controller/auth.js";

const router = express.Router();

router.get("/session", authController.getSession);
router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);
router.post("/signout", authController.signOut);

export default router;

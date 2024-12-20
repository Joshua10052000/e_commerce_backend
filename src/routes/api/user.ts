import express from "express";
import userController from "../../controller/user.js";

const router = express.Router();

router.get("/:id", userController.getUser);

export default router;

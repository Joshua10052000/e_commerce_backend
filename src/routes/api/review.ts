import express from "express";
import reviewsController from "../../controller/review.js";

const router = express.Router();

router.get("/", reviewsController.getReviews);

export default router;

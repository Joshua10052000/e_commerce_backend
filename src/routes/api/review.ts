import express from "express";
import reviewsController from "../../controller/review.js";

const router = express.Router();

router.get("/product-id/:productId", reviewsController.getReviews);
router.post("/", reviewsController.createReview);

export default router;

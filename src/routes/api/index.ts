import express from "express";
import authRouter from "./auth.js";
import productRouter from "./product.js";
import reviewRouter from "./review.js";
import cartRouter from "./cart.js";
import categoryRouter from "./category.js";
import checkoutRouter from "./checkout.js";
import wishlistRouter from "./wishlist.js";
import userRouter from "./user.js";
import orderRouter from "./order.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/products", productRouter);
router.use("/reviews", reviewRouter);
router.use("/cart", cartRouter);
router.use("/categories", categoryRouter);
router.use("/checkout", checkoutRouter);
router.use("/wishlists", wishlistRouter);
router.use("/users", userRouter);
router.use("/orders", orderRouter);

export default router;

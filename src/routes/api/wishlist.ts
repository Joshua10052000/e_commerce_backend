import express from "express";
import wishlistController from "../../controller/wishlist.js";

const router = express.Router();

router.get("/", wishlistController.getWishlists);
router.get("/product-id/:productId", wishlistController.getWishlist);
router.post("/", wishlistController.createWishlist);
router.delete("/:id", wishlistController.deleteWishlist);

export default router;

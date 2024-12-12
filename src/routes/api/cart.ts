import express from "express";
import cartController from "../../controller/cart.js";

const router = express.Router();

router.get("/", cartController.getCart);
router.post("/", cartController.addCartItem);
router.put("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.deleteCartitem);

export default router;

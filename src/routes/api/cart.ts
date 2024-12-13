import express from "express";
import cartController from "../../controller/cart.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/", cartController.getCart);
router.post("/", cartController.addCartItem);
router.put("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.deleteCartitem);

export default router;

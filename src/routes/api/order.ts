import express from "express";
import orderController from "../../controller/orders.js";

const router = express.Router();

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrder);

const itemsRouter = express.Router();

router.use("/order-items", itemsRouter);

itemsRouter.get("/order-id/:orderId", orderController.getOrderItems);

export default router;

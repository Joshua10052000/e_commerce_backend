import express from "express";
import db from "../lib/db.js";
import { z } from "zod";

const orderSchema = {
  getOrderParams: z
    .object({ id: z.string().optional() })
    .strict({ message: "Invalid params" }),
};

async function getOrders(req: express.Request, res: express.Response) {
  const { session } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  try {
    const foundOrders = await db.order.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    });

    res.status(200).json({ orders: foundOrders });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

async function getOrder(req: express.Request, res: express.Response) {
  const { session, params } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedParams = orderSchema.getOrderParams.safeParse(params);

  if (!parsedParams.success) {
    res.status(400).json({ message: parsedParams.error.message });
    return;
  }

  try {
    const foundOrder = await db.order.findUnique({
      where: { id: parsedParams.data.id },
    });

    res.status(200).json({ order: foundOrder });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

const orderItemSchema = {
  getOrderItemsParams: z.object({ orderId: z.string() }),
};

async function getOrderItems(req: express.Request, res: express.Response) {
  const { session, params } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedParams = orderItemSchema.getOrderItemsParams.safeParse(params);

  if (!parsedParams.success) {
    res.status(400).json({ message: parsedParams.error.message });
    return;
  }

  try {
    const orderItems = await db.orderItem.findMany({
      where: { orderId: parsedParams.data.orderId },
    });

    res.status(200).json({ orderItems });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

export default { getOrders, getOrder, getOrderItems };

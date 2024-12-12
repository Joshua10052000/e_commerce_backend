import express from "express";
import db from "../lib/db.js";
import { z } from "zod";

async function getCart(req: express.Request, res: express.Response) {
  try {
    const { session } = req;
    const { user } = session;

    if (!user) {
      res.status(401).json({ message: "Signing in is required" });
      return;
    }

    let cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        cartItems: {
          include: { product: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: user.id },
        include: {
          cartItems: { include: { product: true }, orderBy: { id: "asc" } },
        },
      });
    }

    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const addCartitemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
});

async function addCartItem(req: express.Request, res: express.Response) {
  try {
    const { session, body } = req;
    const { user } = session;

    if (!user) {
      res.status(401).json({ message: "Signing in is required" });
      return;
    }

    let cart = await db.cart.findUnique({ where: { userId: user.id } });

    if (!cart) {
      cart = await db.cart.create({ data: { userId: user.id } });
    }

    const { success, error, data } = addCartitemSchema.safeParse(body);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    await db.cartItem.upsert({
      create: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
      },
      where: {
        cartId_productId: { cartId: cart.id, productId: data.productId },
      },
      update: { quantity: { increment: data.quantity } },
    });

    res
      .status(200)
      .json({ message: "You have successfully created a cart item" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const updateCartitemParams = z.object({ id: z.string() });
const updateCartItemSchema = z.object({ quantity: z.number() });

async function updateCartItem(req: express.Request, res: express.Response) {
  try {
    const { session, params, body } = req;
    const { user } = session;

    if (!user) {
      res.status(401).json({ message: "Signing in is required" });
      return;
    }

    const paramsResult = updateCartitemParams.safeParse(params);

    if (!paramsResult.success) {
      res.status(400).json({ message: paramsResult.error.issues[0].message });
      return;
    }

    const foundCartItem = await db.cartItem.findUnique({
      where: { id: paramsResult.data.id },
    });

    if (!foundCartItem) {
      res.status(400).json({ message: "Cartitem not found" });
      return;
    }

    const schemaResult = updateCartItemSchema.safeParse(body);

    if (!schemaResult.success) {
      res.status(400).json({ message: schemaResult.error.issues[0].message });
      return;
    }

    await db.cartItem.update({
      where: { id: paramsResult.data.id },
      data: { quantity: schemaResult.data.quantity },
    });

    res
      .status(200)
      .json({ message: "You have successfully updated cart item" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const deleteCartitemParams = z.object({ id: z.string() });

async function deleteCartitem(req: express.Request, res: express.Response) {
  try {
    const { params } = req;

    const { success, error, data } = deleteCartitemParams.safeParse(params);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    const foundCart = await db.cartItem.findUnique({ where: { id: data.id } });

    if (!foundCart) {
      res.status(404).json({ message: "Cart item not found" });
      return;
    }

    await db.cartItem.delete({ where: { id: foundCart.id } });

    res
      .status(200)
      .json({ message: "You have successfully deleted the cartitem." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default { getCart, addCartItem, updateCartItem, deleteCartitem };

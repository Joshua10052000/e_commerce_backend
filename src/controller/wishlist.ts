import express from "express";
import z from "zod";
import db from "../lib/db.js";

const schema = {
  getParams: z.object({ productId: z.string() }),
  createBody: z.object({ productId: z.string() }),
  deleteParams: z.object({ id: z.string() }),
};

async function getWishlists(req: express.Request, res: express.Response) {
  const { session } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  try {
    const foundWishlists = await db.wishlist.findMany({
      where: { userId: user.id },
    });

    res.status(200).json({ wishlists: foundWishlists });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

async function getWishlist(req: express.Request, res: express.Response) {
  const { session, params } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedParams = schema.getParams.safeParse(params);

  if (!parsedParams.success) {
    res.status(400).json({ message: parsedParams.error.issues[0].message });
    return;
  }

  try {
    const foundWishlist = await db.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: parsedParams.data.productId,
        },
      },
    });

    res.status(200).json({ wishlist: foundWishlist });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

async function createWishlist(req: express.Request, res: express.Response) {
  const { session, body } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedBody = schema.createBody.safeParse(body);

  if (!parsedBody.success) {
    res.status(400).json({ message: parsedBody.error.issues[0].message });
    return;
  }

  try {
    const { productId } = parsedBody.data;

    const foundProduct = await db.product.findUnique({
      where: { id: productId },
    });

    if (!foundProduct) {
      res.status(404).json({
        message: "Product does not exists, therefore we can't wishlist it",
      });
      return;
    }

    const wishlistedProduct = await db.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (wishlistedProduct) {
      res.status(405).json({ message: "Product is already wishlisted." });
      return;
    }

    await db.wishlist.create({ data: { userId: user.id, productId } });

    res
      .status(201)
      .json({ message: "User has successfully wishlisted the product" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

async function deleteWishlist(req: express.Request, res: express.Response) {
  const { session, params } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedParams = schema.deleteParams.safeParse(params);

  if (!parsedParams.success) {
    res.status(400).json({ message: parsedParams.error.issues[0].message });
    return;
  }

  try {
    const foundWishlist = await db.wishlist.findUnique({
      where: { id: parsedParams.data.id },
    });

    if (!foundWishlist) {
      res.status(404).json({ message: "Wishlist does not exists" });
      return;
    }

    await db.wishlist.delete({ where: { id: foundWishlist.id } });

    res
      .status(200)
      .json({ message: "User has successfully remove product from wishlist" });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

export default { getWishlists, getWishlist, createWishlist, deleteWishlist };

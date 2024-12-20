import express from "express";
import db from "../lib/db.js";
import { z } from "zod";

const schema = {
  getParams: z.object({ productId: z.string() }),
  create: z.object({
    productId: z.string(),
    description: z.string(),
    stars: z.number(),
  }),
};

async function getReviews(req: express.Request, res: express.Response) {
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
    const reviews = await db.review.findMany({
      where: { productId: parsedParams.data.productId },
    });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

async function createReview(req: express.Request, res: express.Response) {
  const { session, body } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedBody = schema.create.safeParse(body);

  if (!parsedBody.success) {
    res.status(400).json({ message: parsedBody.error.message });
    return;
  }

  try {
    const { productId, description, stars } = parsedBody.data;

    const foundReview = await db.review.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (foundReview) {
      res
        .status(405)
        .json({ message: "User has already reviewed this product" });
      return;
    }

    await db.review.create({
      data: { userId: user.id, productId, description, stars },
    });

    res
      .status(201)
      .json({ message: "User has successfully reviewed this product" });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

export default { getReviews, createReview };

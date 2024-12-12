import express from "express";
import db from "../lib/db.js";
import { z } from "zod";

const reviewsQuerySchema = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
});

async function getReviews(req: express.Request, res: express.Response) {
  try {
    const { query } = req;
    const { success, error, data } = reviewsQuerySchema.safeParse(query);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    const reviews = await db.review.findMany({
      where: { ...data },
    });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default { getReviews };

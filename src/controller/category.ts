import express from "express";
import db from "../lib/db.js";

async function getCategories(_: express.Request, res: express.Response) {
  try {
    const categories = await db.category.findMany({});

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default { getCategories };

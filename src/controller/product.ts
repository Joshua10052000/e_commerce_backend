import express from "express";
import db from "../lib/db.js";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const productsQuery = z
  .object({
    "category-name": z.string().optional(),
    limit: z
      .string()
      .transform((value) => parseInt(value))
      .optional(),
    search: z.string().optional(),
    cursor: z.string().optional(),
  })
  .strict();

function buildQuery(query?: z.infer<typeof productsQuery>) {
  let filters: Prisma.ProductFindManyArgs = {};

  if (!query) return filters;

  if (query["search"]) {
    filters = {
      ...filters,
      where: {
        OR: [
          { name: { contains: query["search"], mode: "insensitive" } },
          { description: { contains: query["search"], mode: "insensitive" } },
          {
            categories: {
              some: {
                name: { contains: query["search"], mode: "insensitive" },
              },
            },
          },
        ],
      },
    };
  }

  if (query["category-name"]) {
    filters = {
      ...filters,
      where: {
        categories: {
          some: {
            name: { contains: query["category-name"], mode: "insensitive" },
          },
        },
      },
    };
  }

  if (query["limit"]) {
    filters = { ...filters, take: query["limit"] };
  }

  if (query["cursor"]) {
    filters = {
      ...filters,
      cursor: {
        id: query["cursor"],
      },
    };
    filters.skip = 1;
  }

  return filters;
}

async function getProducts(req: express.Request, res: express.Response) {
  try {
    const { query } = req;
    const { success, error, data } = productsQuery.safeParse(query);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    const filters = buildQuery(data);

    const products = await db.product.findMany({
      ...filters,
    });
    const cursor =
      products.length > 0 ? products[products.length - 1].id : null;

    res.status(200).json({ products, cursor, count: products.length });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const productParams = z.object({
  id: z.string(),
});

async function getProduct(req: express.Request, res: express.Response) {
  try {
    const { params } = req;
    const { success, error, data } = productParams.safeParse(params);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    const product = await db.product.findFirst({ where: { id: data.id } });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default { getProducts, getProduct };

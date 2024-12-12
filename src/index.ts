import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import keys from "./lib/keys.js";
import router from "./routes/api/index.js";
import path from "path";
import { faker } from "@faker-js/faker";
import { Product } from "@prisma/client";
import db from "./lib/db.js";

const app = express();

app.use(cors({ credentials: true, origin: ["http://localhost:5173"] }));

app.use(express.static(path.resolve("./public")));

app.use(express.json());

app.use(cookieParser());

app.use(
  session({
    store: new session.MemoryStore(),
    saveUninitialized: false,
    resave: false,
    secret: keys.server.sessionSecret,
    cookie: {
      secure: keys.server.mode === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(express.urlencoded({ extended: false }));

app.use("/api", router);

app.listen(keys.server.port, () =>
  console.log(`Server running on port: ${keys.server.port}`)
);

function generateProduct() {
  const product: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    priceCents: parseFloat(faker.commerce.price()),
    images: Array.from(
      { length: Math.floor(Math.random() * 4) + 1 },
      () => "/placeholder.svg"
    ),
  };

  return product;
}

// Array.from({ length: 100 }, async () => {
//   const categories = await db.category.findMany({});
//   const randomCategory =
//     categories[Math.floor(Math.random() * categories.length)];

//   const product = generateProduct();

//   await db.product.create({
//     data: {
//       ...product,
//       categories: {
//         connect: {
//           name: { equals: randomCategory.name },
//           id: randomCategory.id,
//         },
//       },
//     },
//   });
// });

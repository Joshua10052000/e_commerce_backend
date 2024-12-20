import { PrismaClient } from "@prisma/client";
import keys from "./keys.js";

const db = globalThis.prismaGlobal ?? new PrismaClient();

if (keys.server.environment !== "production") {
  globalThis.prismaGlobal = db;
}

export default db;

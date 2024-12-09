import { PrismaClient } from "@prisma/client";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "production" | "development" | "testing";
      PORT: string;
      SESSION_SECRET: string;
      DATABASE_URL: string;
    }
  }

  var prismaGlobal: PrismaClient | undefined;
}

export {};

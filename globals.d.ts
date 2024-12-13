import { PrismaClient } from "@prisma/client";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: string;
      SERVER_NODE_ENV: "production" | "development" | "testing";
      SERVER_SESSION_SECRET: string;
      SERVER_DATABASE_URL: string;

      PAYPAL_CLIENT_ID: string;
      PAYPAL_CLIENT_SECRET: string;
      PAYPAL_ACCESS_TOKEN?: string;

      CLIENT_URL: string;
    }
  }

  var prismaGlobal: PrismaClient | undefined;
}

export {};

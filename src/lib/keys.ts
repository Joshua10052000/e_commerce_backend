import dotenv from "dotenv";

dotenv.config();

const keys = {
  server: {
    port: process.env.SERVER_PORT,
    mode: process.env.SERVER_NODE_ENV,
    sessionSecret: process.env.SERVER_SESSION_SECRET,
    databaseUrl: process.env.SERVER_DATABASE_URL,
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  client: {
    url: process.env.CLIENT_URL,
  },
};

export default keys;

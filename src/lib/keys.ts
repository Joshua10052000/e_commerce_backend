process.loadEnvFile();

const keys = {
  server: {
    port: process.env.PORT,
    mode: process.env.NODE_ENV,
    sessionSecret: process.env.SESSION_SECRET,
    databaseUrl: process.env.DATABASE_URL,
  },
};

export default keys;

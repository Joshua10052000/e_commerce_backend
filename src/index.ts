import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import fs from "fs";
import https from "https";
import keys from "./lib/keys.js";
import sessionStore from "./lib/session-store.js";
import router from "./routes/api/index.js";

const app = express();

if (keys.server.mode === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    credentials: true,
    origin: [keys.client.url, keys.client.productionUrl],
  })
);

app.use(express.static(path.resolve("./public")));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

const opts: session.SessionOptions = {
  store: sessionStore,
  saveUninitialized: false,
  resave: false,
  secret: keys.server.sessionSecret,
  cookie: {
    secure: keys.server.mode === "production",
    sameSite: keys.server.mode !== "production" ? "strict" : "none",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(opts));

app.get("/", (_, res) => {
  res.send("Hello, World!");
});

app.use("/api", router);

app.post(
  "/webhooks/paypal",
  express.raw({ type: "application/json" }),
  async (_, res) => {
    res.sendStatus(200);
  }
);

const server =
  keys.server.mode !== "production"
    ? https.createServer(
        {
          cert: fs.readFileSync("C:/Windows/System32/localhost.pem"),
          key: fs.readFileSync("C:/Windows/System32/localhost-key.pem"),
        },
        app
      )
    : app;

server.listen(keys.server.port, () => {
  console.log(`Server running on port: ${keys.server.port}`);
  console.log(`https://localhost:${keys.server.port}`);
});

import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import keys from "./lib/keys.js";
import sessionStore from "./lib/session-store.js";
import router from "./routes/api/index.js";

const app = express();

app.use(cors({ credentials: true, origin: [keys.client.url] }));

app.use(express.static(path.resolve("./public")));

app.use(express.json());

app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));

const opts: session.SessionOptions = {
  proxy: true,
  store: sessionStore,
  saveUninitialized: false,
  resave: false,
  secret: keys.server.sessionSecret,
  cookie: {
    secure: keys.server.mode === "production",
    sameSite: keys.server.mode !== "production" ? "strict" : "none",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    domain: ".onrender.com",
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

app.listen(keys.server.port, () => {
  console.log(`Server running on port: ${keys.server.port}`);
  console.log(`http://localhost:${keys.server.port}`);
});

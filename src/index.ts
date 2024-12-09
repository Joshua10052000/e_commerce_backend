import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import keys from "./lib/keys.js";
import router from "./routes/api/index.js";

const app = express();

app.use(
  cors({ credentials: true, origin: ["http://localhost:5173"], methods: ["*"] })
);

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

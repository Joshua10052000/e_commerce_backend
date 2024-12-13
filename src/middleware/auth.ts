import express from "express";

async function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { session } = req;
  const { user } = session;

  if (!user) {
    res
      .status(401)
      .json({ message: "Authenticating is required, please sign in." });
    return;
  }

  next();
}

export { authenticate };

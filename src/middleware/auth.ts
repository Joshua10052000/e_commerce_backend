import express from "express";

async function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { session } = req;
  const { user } = session;
  console.error(user);

  if (!user) {
    res.status(401).json({ message: "Singing in is required" });
    return;
  }

  next();
}

export { authenticate };

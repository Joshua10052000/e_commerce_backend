import express from "express";
import z from "zod";
import db from "../lib/db.js";

const schema = {
  getParams: z.object({ id: z.string() }),
};

async function getUser(req: express.Request, res: express.Response) {
  const { session, params } = req;
  const { user } = session;

  if (!user) {
    res.status(401).json({ message: "Authentication is required" });
    return;
  }

  const parsedParams = schema.getParams.safeParse(params);

  if (!parsedParams.success) {
    res.status(400).json({ message: parsedParams.error.issues[0].message });
    return;
  }

  try {
    const foundUser = await db.user.findUnique({
      where: { id: parsedParams.data.id },
    });

    if (!foundUser) {
      res.status(200).json({ user: null });
      return;
    }

    const { password: _, ...user } = foundUser;

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error occured" });
  }
}

export default { getUser };

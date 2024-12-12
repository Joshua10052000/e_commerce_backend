import express from "express";
import z from "zod";
import bcrypt from "bcrypt";
import db from "../lib/db.js";

const signupSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email format" }),
    password: z.string().min(1, { message: "Password is required" }),
    confirmPassword: z.string().min(1, { message: "Confirm your password" }),
  })
  .refine((schema) => schema.password === schema.confirmPassword, {
    message: "Password does not matched",
    path: ["confirmPassword"],
  });

const GEN_SALT = 10;

async function signUp(req: express.Request, res: express.Response) {
  try {
    const { body } = req;

    const { success, error, data } = signupSchema.safeParse(body);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    const { confirmPassword: _, ...input } = data;

    const foundUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (foundUser) {
      res.status(409).json({ message: "Email is already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, GEN_SALT);

    const user = await db.user.create({
      data: { ...input, password: hashedPassword },
    });

    await db.account.create({
      data: {
        userId: user.id,
        providerAccountId: user.id,
        provider: "credentials",
        type: "credentials",
      },
    });

    res
      .status(201)
      .json({ message: "You have successfully created an account" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const signinSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

async function signIn(req: express.Request, res: express.Response) {
  try {
    const { body } = req;

    const { success, error, data } = signinSchema.safeParse(body);

    if (!success) {
      res.status(400).json({ message: error.issues[0].message });
      return;
    }

    const foundUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!foundUser) {
      res.status(404).json({ message: "Email is not yet registered" });
      return;
    }

    if (!foundUser.password) {
      res
        .status(405)
        .json({ message: "Sign in using your email you used originally" });
      return;
    }

    const matchedPassword = await bcrypt.compare(
      data.password,
      foundUser.password
    );

    if (!matchedPassword) {
      res.status(401).json({ message: "Password does not matched" });
      return;
    }

    const { password: _, ...user } = foundUser;

    req.session.user = user;

    res.status(200).json({ message: "You are successfully signed in", user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function signOut(req: express.Request, res: express.Response) {
  try {
    req.session.destroy((error) => {
      if (error) {
        res
          .status(500)
          .json({ message: "Something went wrong when destroying sessions" });
        return;
      }
    });

    res.status(200).json({ message: "You have successfully signed out" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getSession(req: express.Request, res: express.Response) {
  try {
    const { session } = req;

    res.status(200).json({ user: session.user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default { signUp, signIn, signOut, getSession };

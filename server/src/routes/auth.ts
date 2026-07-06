import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db.js";
import { JWT_SECRET } from "../middleware/auth.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";

export const authRouter = Router();

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["staff", "manager"]).default("staff"),
});

const LoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const result = RegisterSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) fields[String(e.path[0])] = e.message;
      });
      throw new ApiError(400, "Validation failed", fields);
    }

    const { name, email, password, role } = result.data;
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) throw new ApiError(409, "Email already registered", { email: "Email already in use" });

    const password_hash = await bcrypt.hash(password, 12);
    const row = db
      .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(name, email, password_hash, role);

    const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(row.lastInsertRowid) as { id: number; name: string; email: string; role: "staff" | "manager"; created_at: string };

    const token = jwt.sign({ userId: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) fields[String(e.path[0])] = e.message;
      });
      throw new ApiError(400, "Validation failed", fields);
    }

    const { email, password } = result.data;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as { id: number; name: string; email: string; role: "staff" | "manager"; password_hash: string; created_at: string } | undefined;

    if (!user) throw new ApiError(401, "Invalid email or password");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    const token = jwt.sign({ userId: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  })
);

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  })
);

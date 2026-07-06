import type { NextFunction, Request, Response } from "express";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

// Never hardcode a secret in source. Use the env var in real deployments;
// fall back to an ephemeral per-boot random secret for local dev.
export const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString("hex");

export interface JwtPayload {
  userId: number;
  role: "staff" | "manager" | "admin";
  name: string;
  email: string;
}

type Role = "staff" | "manager" | "admin";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
    role?: Role;
  }
}

// Reads an optional JWT (Authorization: Bearer) and/or an x-api-role header.
// Floor staff use the lightweight role header; the JWT path is available for
// authenticated sessions. The effective role prefers a verified token.
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      // invalid token — fall through to header-based role
    }
  }
  const headerRole = req.header("x-api-role");
  req.role = req.user?.role ?? (headerRole === "manager" ? "manager" : "staff");
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user && !req.role) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (req.role !== "manager" && req.role !== "admin") {
    res.status(403).json({ error: "Manager role required for this action" });
    return;
  }
  next();
}

import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { sanitizeObject } from "../sanitize.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { requireManager } from "../middleware/auth.js";

export const customersRouter = Router();

const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(30),
  email: z.string().email("Invalid email format").max(200).optional().or(z.literal("")),
});

customersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      const rows = db.prepare(
        "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
      ).all(term, term, term, limitNum, offset);
      const total = (db.prepare(
        "SELECT COUNT(*) as count FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?"
      ).get(term, term, term) as { count: number }).count;
      res.json({ data: rows, total, page: pageNum, limit: limitNum });
      return;
    }

    const rows = db.prepare("SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limitNum, offset);
    const total = (db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number }).count;
    res.json({ data: rows, total, page: pageNum, limit: limitNum });
  })
);

customersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
    if (!row) throw new ApiError(404, "Customer not found");
    res.json(row);
  })
);

customersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = CustomerSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["name", "phone", "email"]);
    const row = db.prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)").run(clean.name, clean.phone, clean.email || null);
    res.status(201).json(db.prepare("SELECT * FROM customers WHERE id = ?").get(row.lastInsertRowid));
  })
);

customersRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = CustomerSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["name", "phone", "email"]);
    const upd = db.prepare(
      "UPDATE customers SET name = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(clean.name, clean.phone, clean.email || null, req.params.id);
    if (upd.changes === 0) throw new ApiError(404, "Customer not found");
    res.json(db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id));
  })
);

customersRouter.delete(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    const result = db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw new ApiError(404, "Customer not found");
    res.status(204).end();
  })
);

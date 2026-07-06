import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { sanitizeObject } from "../sanitize.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { requireManager } from "../middleware/auth.js";

export const mechanicsRouter = Router();

const MechanicSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  specialty: z.string().min(1, "Specialty is required").max(100),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

mechanicsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, active, page, limit } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let sql = "SELECT * FROM mechanics WHERE 1=1";
    const params: unknown[] = [];

    if (active !== undefined) { sql += " AND active = ?"; params.push(active === "true" || active === "1" ? 1 : 0); }
    if (q?.trim()) {
      sql += " AND (name LIKE ? OR specialty LIKE ?)";
      const t = `%${q.trim()}%`;
      params.push(t, t);
    }

    const sqlParams = params as Parameters<typeof db.prepare>[0][];
    const total = (db.prepare(sql.replace("SELECT *", "SELECT COUNT(*) as count")).get(...sqlParams) as { count: number }).count;
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const rows = db.prepare(sql).all(...sqlParams, limitNum, offset);
    res.json({ data: rows, total, page: pageNum, limit: limitNum });
  })
);

mechanicsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db.prepare("SELECT * FROM mechanics WHERE id = ?").get(req.params.id);
    if (!row) throw new ApiError(404, "Mechanic not found");
    res.json(row);
  })
);

mechanicsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = MechanicSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["name", "specialty"]);
    const row = db.prepare("INSERT INTO mechanics (name, specialty, active) VALUES (?, ?, ?)").run(clean.name, clean.specialty, clean.active);
    res.status(201).json(db.prepare("SELECT * FROM mechanics WHERE id = ?").get(row.lastInsertRowid));
  })
);

mechanicsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = MechanicSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["name", "specialty"]);
    const upd = db.prepare(
      "UPDATE mechanics SET name = ?, specialty = ?, active = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(clean.name, clean.specialty, clean.active, req.params.id);
    if (upd.changes === 0) throw new ApiError(404, "Mechanic not found");
    res.json(db.prepare("SELECT * FROM mechanics WHERE id = ?").get(req.params.id));
  })
);

mechanicsRouter.delete(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    const result = db.prepare("DELETE FROM mechanics WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw new ApiError(404, "Mechanic not found");
    res.status(204).end();
  })
);

import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { sanitizeObject } from "../sanitize.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { requireManager } from "../middleware/auth.js";

export const vehiclesRouter = Router();

const VehicleSchema = z.object({
  customer_id: z.coerce.number().int().positive("Customer is required"),
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2, "Invalid year"),
  license_plate: z.string().min(1, "License plate is required").max(20),
});

vehiclesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, customer_id, page, limit } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let sql = `SELECT vehicles.*, customers.name AS customer_name FROM vehicles
               JOIN customers ON customers.id = vehicles.customer_id WHERE 1=1`;
    const params: unknown[] = [];

    if (customer_id) { sql += " AND vehicles.customer_id = ?"; params.push(customer_id); }
    if (q?.trim()) {
      sql += " AND (vehicles.make LIKE ? OR vehicles.model LIKE ? OR vehicles.license_plate LIKE ? OR customers.name LIKE ?)";
      const t = `%${q.trim()}%`;
      params.push(t, t, t, t);
    }

    const countSql = sql.replace(
      "SELECT vehicles.*, customers.name AS customer_name",
      "SELECT COUNT(*) as count"
    );
    const sqlParams = params as Parameters<typeof db.prepare>[0][];
    const total = (db.prepare(countSql).get(...sqlParams) as { count: number }).count;
    sql += " ORDER BY vehicles.created_at DESC LIMIT ? OFFSET ?";
    const rows = db.prepare(sql).all(...sqlParams, limitNum, offset);
    res.json({ data: rows, total, page: pageNum, limit: limitNum });
  })
);

vehiclesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db.prepare(
      "SELECT vehicles.*, customers.name AS customer_name FROM vehicles JOIN customers ON customers.id = vehicles.customer_id WHERE vehicles.id = ?"
    ).get(req.params.id);
    if (!row) throw new ApiError(404, "Vehicle not found");
    res.json(row);
  })
);

vehiclesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = VehicleSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["make", "model", "license_plate"]);
    const row = db.prepare(
      "INSERT INTO vehicles (customer_id, make, model, year, license_plate) VALUES (?, ?, ?, ?, ?)"
    ).run(clean.customer_id, clean.make, clean.model, clean.year, clean.license_plate);
    res.status(201).json(db.prepare("SELECT vehicles.*, customers.name AS customer_name FROM vehicles JOIN customers ON customers.id = vehicles.customer_id WHERE vehicles.id = ?").get(row.lastInsertRowid));
  })
);

vehiclesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = VehicleSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["make", "model", "license_plate"]);
    const upd = db.prepare(
      "UPDATE vehicles SET customer_id = ?, make = ?, model = ?, year = ?, license_plate = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(clean.customer_id, clean.make, clean.model, clean.year, clean.license_plate, req.params.id);
    if (upd.changes === 0) throw new ApiError(404, "Vehicle not found");
    res.json(db.prepare("SELECT vehicles.*, customers.name AS customer_name FROM vehicles JOIN customers ON customers.id = vehicles.customer_id WHERE vehicles.id = ?").get(req.params.id));
  })
);

vehiclesRouter.delete(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    const result = db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw new ApiError(404, "Vehicle not found");
    res.status(204).end();
  })
);

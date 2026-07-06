import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { sanitizeObject } from "../sanitize.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { requireManager } from "../middleware/auth.js";

export const bookingsRouter = Router();

const STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

const BookingSchema = z.object({
  customer_id: z.coerce.number().int().positive("Customer is required"),
  vehicle_id: z.coerce.number().int().positive("Vehicle is required"),
  mechanic_id: z.coerce.number().int().positive("Mechanic is required"),
  service_type: z.string().min(1, "Service type is required").max(200),
  scheduled_at: z.string().min(1, "Scheduled date/time is required"),
  status: z.enum(STATUSES).default("pending"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

const JOIN_SQL = `
  SELECT bookings.*, customers.name AS customer_name,
         vehicles.make AS vehicle_make, vehicles.model AS vehicle_model,
         vehicles.license_plate AS vehicle_plate,
         mechanics.name AS mechanic_name
  FROM bookings
  JOIN customers ON customers.id = bookings.customer_id
  JOIN vehicles ON vehicles.id = bookings.vehicle_id
  JOIN mechanics ON mechanics.id = bookings.mechanic_id`;

bookingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, status, mechanic_id, customer_id, page, limit } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || "50", 10)));
    const offset = (pageNum - 1) * limitNum;

    let where = "WHERE 1=1";
    const params: unknown[] = [];

    if (status) { where += " AND bookings.status = ?"; params.push(status); }
    if (mechanic_id) { where += " AND bookings.mechanic_id = ?"; params.push(mechanic_id); }
    if (customer_id) { where += " AND bookings.customer_id = ?"; params.push(customer_id); }
    if (q?.trim()) {
      where += " AND (customers.name LIKE ? OR bookings.service_type LIKE ? OR mechanics.name LIKE ?)";
      const t = `%${q.trim()}%`;
      params.push(t, t, t);
    }

    const countSql = `SELECT COUNT(*) as count FROM bookings JOIN customers ON customers.id = bookings.customer_id JOIN vehicles ON vehicles.id = bookings.vehicle_id JOIN mechanics ON mechanics.id = bookings.mechanic_id ${where}`;
    const sqlParams = params as Parameters<typeof db.prepare>[0][];
    const total = (db.prepare(countSql).get(...sqlParams) as { count: number }).count;
    const rows = db.prepare(`${JOIN_SQL} ${where} ORDER BY bookings.scheduled_at DESC LIMIT ? OFFSET ?`).all(...sqlParams, limitNum, offset);
    res.json({ data: rows, total, page: pageNum, limit: limitNum });
  })
);

bookingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = db.prepare(`${JOIN_SQL} WHERE bookings.id = ?`).get(req.params.id);
    if (!row) throw new ApiError(404, "Booking not found");
    res.json(row);
  })
);

bookingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = BookingSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["service_type", "notes"]);
    const row = db.prepare(
      "INSERT INTO bookings (customer_id, vehicle_id, mechanic_id, service_type, scheduled_at, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(clean.customer_id, clean.vehicle_id, clean.mechanic_id, clean.service_type, clean.scheduled_at, clean.status, clean.notes || null);
    res.status(201).json(db.prepare(`${JOIN_SQL} WHERE bookings.id = ?`).get(row.lastInsertRowid));
  })
);

bookingsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = BookingSchema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.issues.forEach((e) => { if (e.path[0]) fields[String(e.path[0])] = e.message; });
      throw new ApiError(400, "Validation failed", fields);
    }
    const clean = sanitizeObject(result.data, ["service_type", "notes"]);
    const upd = db.prepare(
      "UPDATE bookings SET customer_id = ?, vehicle_id = ?, mechanic_id = ?, service_type = ?, scheduled_at = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(clean.customer_id, clean.vehicle_id, clean.mechanic_id, clean.service_type, clean.scheduled_at, clean.status, clean.notes || null, req.params.id);
    if (upd.changes === 0) throw new ApiError(404, "Booking not found");
    res.json(db.prepare(`${JOIN_SQL} WHERE bookings.id = ?`).get(req.params.id));
  })
);

bookingsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: string };
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw new ApiError(400, "Invalid status", { status: "Invalid status value" });
    }
    const upd = db.prepare(
      "UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(status, req.params.id);
    if (upd.changes === 0) throw new ApiError(404, "Booking not found");
    res.json(db.prepare(`${JOIN_SQL} WHERE bookings.id = ?`).get(req.params.id));
  })
);

bookingsRouter.delete(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    const result = db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
    if (result.changes === 0) throw new ApiError(404, "Booking not found");
    res.status(204).end();
  })
);

import { Router } from "express";
import { db } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const statsRouter = Router();

statsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const totalCustomers = (db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number }).count;
    const totalVehicles = (db.prepare("SELECT COUNT(*) as count FROM vehicles").get() as { count: number }).count;
    const totalMechanics = (db.prepare("SELECT COUNT(*) as count FROM mechanics").get() as { count: number }).count;
    const activeMechanics = (db.prepare("SELECT COUNT(*) as count FROM mechanics WHERE active = 1").get() as { count: number }).count;
    const totalBookings = (db.prepare("SELECT COUNT(*) as count FROM bookings").get() as { count: number }).count;

    const byStatus = db.prepare(
      "SELECT status, COUNT(*) as count FROM bookings GROUP BY status"
    ).all() as { status: string; count: number }[];

    const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r.count]));

    const todayBookings = (db.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE date(scheduled_at) = date('now')"
    ).get() as { count: number }).count;

    const recentBookings = db.prepare(
      `SELECT bookings.id, bookings.service_type, bookings.status, bookings.scheduled_at,
              customers.name AS customer_name, mechanics.name AS mechanic_name,
              vehicles.make || ' ' || vehicles.model AS vehicle
       FROM bookings
       JOIN customers ON customers.id = bookings.customer_id
       JOIN vehicles ON vehicles.id = bookings.vehicle_id
       JOIN mechanics ON mechanics.id = bookings.mechanic_id
       ORDER BY bookings.created_at DESC LIMIT 5`
    ).all();

    const bookingsByDay = db.prepare(
      `SELECT date(scheduled_at) as day, COUNT(*) as count
       FROM bookings
       WHERE scheduled_at >= date('now', '-30 days')
       GROUP BY date(scheduled_at)
       ORDER BY day ASC`
    ).all();

    const mechanicWorkload = db.prepare(
      `SELECT mechanics.name, COUNT(bookings.id) as bookings,
              SUM(CASE WHEN bookings.status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM mechanics
       LEFT JOIN bookings ON bookings.mechanic_id = mechanics.id
       WHERE mechanics.active = 1
       GROUP BY mechanics.id
       ORDER BY bookings DESC
       LIMIT 6`
    ).all();

    res.json({
      totalCustomers,
      totalVehicles,
      totalMechanics,
      activeMechanics,
      totalBookings,
      todayBookings,
      pending: statusMap.pending || 0,
      in_progress: statusMap.in_progress || 0,
      completed: statusMap.completed || 0,
      cancelled: statusMap.cancelled || 0,
      recentBookings,
      bookingsByDay,
      mechanicWorkload,
    });
  })
);

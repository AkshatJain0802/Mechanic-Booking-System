import cors from "cors";
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import "./db.js";
import { attachUser } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { bookingsRouter } from "./routes/bookings.js";
import { customersRouter } from "./routes/customers.js";
import { mechanicsRouter } from "./routes/mechanics.js";
import { vehiclesRouter } from "./routes/vehicles.js";
import { statsRouter } from "./routes/stats.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Allowed origins: comma-separated CORS_ORIGIN env (the deployed frontend URL)
// plus localhost for development. Matching is lenient — trailing slashes are
// ignored and any *.vercel.app origin is allowed so preview deploys work too.
const allowList = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/+$/, "");
      const isAllowed =
        allowList.length === 0 ||
        allowList.includes(normalized) ||
        normalized === "http://localhost:5173" ||
        /\.vercel\.app$/.test(new URL(normalized).hostname);
      cb(null, isAllowed);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
app.use("/api", limiter);

app.use(attachUser);

app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.use("/api/auth", authRouter);
app.use("/api/stats", statsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/mechanics", mechanicsRouter);
app.use("/api/bookings", bookingsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔧 Mechanic Booking System API → http://localhost:${PORT}`);
});

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { schema } from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DB_PATH lets a host (e.g. Render persistent disk) point at a durable
// location; defaults to a file alongside the app for local development.
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data.db");
export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(schema);

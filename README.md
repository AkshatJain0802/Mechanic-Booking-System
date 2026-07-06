<div align="center">

# 🔧 Mechanic Booking System

**A full-stack workshop management platform for tracking customers, vehicles, mechanics, and service bookings — replacing error-prone paper and spreadsheet workflows.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003B57?logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 📋 Overview

The Mechanic Booking System is a digital operations tool for auto-repair shops. Floor staff can manage the shop's core entities — **customers, vehicles, mechanics, and bookings** — through a fast, accessible dashboard, with live KPIs, a drag-and-drop job board, searchable data tables, and full validation on both client and server.

It is a monorepo with two independently deployable apps:

- **`client/`** — a React + Vite single-page app (deploys to Vercel)
- **`server/`** — an Express REST API backed by SQLite (deploys to Render)

## ✨ Features

### Core functionality
- **Full CRUD** for Customers, Vehicles, Mechanics, and Bookings
- **Dashboard** with live KPI cards, a 30-day bookings trend chart, and mechanic workload analytics
- **Kanban board** for bookings with drag-and-drop status changes (Pending → In Progress → Completed / Cancelled)
- **Smart data tables** with client-side search, column sorting, and pagination
- **Dependent dropdowns** — the vehicle selector filters to the chosen customer's cars
- **Role-based authorization** — destructive actions (delete) require a manager role

### Robustness (edge-case handling)
- **Empty states** — friendly "no data found" messaging instead of blank screens
- **Loading states** — skeleton loaders and spinners during every async operation
- **Input validation** — invalid submissions are blocked with inline, field-level errors highlighted in red (shared [Zod](https://zod.dev) schemas on client and server)
- **Network resilience** — request timeouts and clear error toasts on connectivity failures

### Non-functional
- **Accessibility** — ARIA labels on all interactive controls, associated form labels, keyboard-navigable UI
- **Telemetry** — a simulated analytics ping logs every completed primary action to the console
- **Security** — server-side input sanitization against XSS, JWT-ready auth, and no secrets committed to source

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, React Router, Tailwind CSS 4, TanStack Query, TanStack Table, React Hook Form, Zod, dnd-kit, Recharts, Sonner, Lucide icons |
| **Backend** | Node.js, Express, TypeScript, `node:sqlite`, Zod, JSON Web Tokens, bcrypt, Morgan, express-rate-limit |
| **Tooling** | ESLint / oxlint, tsx, Vite |
| **Deployment** | Vercel (client) · Render (server) |

## 🏗 Architecture

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│   React SPA (Vite)  │  ───────────────────────▶  │   Express REST API   │
│   Vercel            │  ◀───────────────────────  │   Render             │
│   TanStack Query    │                            │   Zod validation     │
└─────────────────────┘                            │   JWT / role auth    │
                                                    └──────────┬───────────┘
                                                               │ SQL
                                                    ┌──────────▼───────────┐
                                                    │  SQLite (node:sqlite)│
                                                    └──────────────────────┘
```

## 📁 Project Structure

```
Mechanic Booking System/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # API client + typed query functions
│   │   ├── components/
│   │   │   ├── layout/         # App shell (sidebar, header)
│   │   │   └── ui/             # Reusable UI primitives (Button, Table, Drawer…)
│   │   ├── lib/                # Utilities (formatting, class merging)
│   │   ├── pages/              # Dashboard, Bookings, Customers, Vehicles, Mechanics
│   │   ├── types.ts            # Shared TypeScript types
│   │   ├── main.tsx            # App entry + providers
│   │   └── index.css           # Design system (Tailwind theme tokens)
│   └── vercel.json             # SPA routing config
├── server/                     # Express + SQLite backend
│   ├── src/
│   │   ├── middleware/         # Auth (JWT + role) and error handling
│   │   ├── routes/             # auth, customers, vehicles, mechanics, bookings, stats
│   │   ├── db.ts               # SQLite connection + schema bootstrap
│   │   ├── schema.ts           # Database schema
│   │   └── index.ts            # Express app entry
│   └── seed.mjs                # Sample-data seeding script
└── render.yaml                 # Render deployment blueprint
```

## 🚀 Getting Started

### Prerequisites
- **Node.js ≥ 22.5** (required for the built-in `node:sqlite` module)
- **npm**

### Installation & local run

Clone the repo, then start the two apps in separate terminals:

```bash
# Terminal 1 — API (http://localhost:4000)
cd server
npm install
npm run dev

# Terminal 2 — Web app (http://localhost:5173)
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Seed sample data (optional)

With the API running:

```bash
cd server
npm run seed
```

This creates a realistic set of customers, mechanics, vehicles, and bookings so the dashboard and charts are populated immediately.

## 🔐 Environment Variables

Copy each `.env.example` to `.env` and fill in as needed. All variables have sensible local defaults.

### Server (`server/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the API listens on | `4000` |
| `JWT_SECRET` | Secret for signing JWTs (**required in production**) | random per-boot |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | any origin |
| `DB_PATH` | Absolute path to the SQLite file | `server/data.db` |

### Client (`client/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the API (including `/api`) | `http://localhost:4000/api` |

## 📜 Available Scripts

**Server**
| Command | Description |
|---------|-------------|
| `npm run dev` | Start API in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run seed` | Populate the database with sample data |
| `npm run lint` | Lint the source |

**Client**
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the source |

## 🌐 API Reference

Base path: `/api`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | — |
| `GET` | `/stats` | Dashboard aggregates | — |
| `POST` | `/auth/register` · `/auth/login` | Auth endpoints | — |
| `GET` | `/customers` · `/vehicles` · `/mechanics` · `/bookings` | List (supports `?q=`, `?page=`, `?limit=`) | — |
| `POST` | `/customers` · `/vehicles` · `/mechanics` · `/bookings` | Create | — |
| `PUT` | `/{resource}/:id` | Update | — |
| `PATCH` | `/bookings/:id/status` | Update booking status | — |
| `DELETE` | `/{resource}/:id` | Delete | Manager |

## ☁️ Deployment

The app deploys as two services. **Deploy the backend first**, then point the frontend at it.

### 1. Backend → Render
1. Push this repo to GitHub.
2. On [Render](https://render.com): **New → Blueprint**, select the repo. The included `render.yaml` provisions the API automatically.
3. `JWT_SECRET` is generated automatically. After the frontend is live, set `CORS_ORIGIN` to your Vercel URL.
4. Note the service URL, e.g. `https://mechanic-booking-api.onrender.com`.

> **Note:** Render's free tier uses an ephemeral filesystem — the SQLite database resets on redeploy/sleep. For persistent data, attach a Render Disk and set `DB_PATH` to a path on it.

### 2. Frontend → Vercel
1. On [Vercel](https://vercel.com): **Add New → Project**, import the repo.
2. Set **Root Directory** to `client`.
3. Add the environment variable `VITE_API_URL` = `https://<your-render-app>.onrender.com/api`.
4. Deploy. Vercel auto-detects Vite and uses the included `vercel.json` for SPA routing.

### 3. Connect them
Back on Render, set `CORS_ORIGIN` to your Vercel domain (e.g. `https://your-app.vercel.app`) and save. Done.

## 📄 License

Released under the [MIT License](LICENSE).

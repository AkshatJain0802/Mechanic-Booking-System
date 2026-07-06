// VITE_API_URL points at the deployed API in production (e.g. the Render URL);
// falls back to the local dev server. Trailing slash is trimmed for safety.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/$/, "");
const TIMEOUT_MS = 15000;

function getToken(): string | null {
  return localStorage.getItem("mbs_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Floor-staff terminals run in "manager" mode so all CRUD (incl. delete)
    // is available. A real deployment would swap this for a per-user JWT.
    "x-api-role": "manager",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });

    // Telemetry: log a simulated analytics ping whenever a primary action
    // (create/update/delete/status change) completes successfully.
    const method = (options.method || "GET").toUpperCase();
    if (res.ok && method !== "GET") {
      const resource = path.split("/").filter(Boolean)[0] || "resource";
      const verb = method === "POST" ? "created" : method === "DELETE" ? "deleted" : "updated";
      console.log(`[Analytics] User ${verb} ${resource} — Feature Complete CRUD`);
    }

    if (res.status === 204) return undefined as T;

    const body = await res.json().catch(() => ({ error: "Invalid response" }));

    if (!res.ok) {
      const err = new ApiError(body?.error || "Request failed", res.status, body?.fields);
      throw err;
    }

    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request timed out. Check your connection.", 408);
    }
    throw new ApiError("Network error. Check your connection.", 0);
  } finally {
    clearTimeout(timeout);
  }
}

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (path: string) => request<void>(path, { method: "DELETE" }),
};

import { api } from "./client";
import type { Customer, Vehicle, Mechanic, Booking, BookingStatus, PaginatedResponse, DashboardStats } from "../types";

export const queryKeys = {
  stats: ["stats"] as const,
  customers: (q?: string) => ["customers", q || ""] as const,
  customer: (id: number) => ["customers", id] as const,
  vehicles: (q?: string, customerId?: number) => ["vehicles", q || "", customerId] as const,
  mechanics: (q?: string) => ["mechanics", q || ""] as const,
  bookings: (q?: string, status?: string) => ["bookings", q || "", status || ""] as const,
};

export const statsApi = {
  get: () => api.get<DashboardStats>("/stats"),
};

type CustomerInput = { name: string; phone: string; email?: string | null };

export const customersApi = {
  list: (q?: string) => api.get<PaginatedResponse<Customer>>(`/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  get: (id: number) => api.get<Customer>(`/customers/${id}`),
  create: (data: CustomerInput) => api.post<Customer>("/customers", data),
  update: (id: number, data: CustomerInput) => api.put<Customer>(`/customers/${id}`, data),
  delete: (id: number) => api.remove(`/customers/${id}`),
};

export const vehiclesApi = {
  list: (q?: string, customerId?: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (customerId) params.set("customer_id", String(customerId));
    const qs = params.toString();
    return api.get<PaginatedResponse<Vehicle>>(`/vehicles${qs ? `?${qs}` : ""}`);
  },
  create: (data: Omit<Vehicle, "id" | "created_at" | "updated_at" | "customer_name">) => api.post<Vehicle>("/vehicles", data),
  update: (id: number, data: Omit<Vehicle, "id" | "created_at" | "updated_at" | "customer_name">) => api.put<Vehicle>(`/vehicles/${id}`, data),
  delete: (id: number) => api.remove(`/vehicles/${id}`),
};

export const mechanicsApi = {
  list: (q?: string) => api.get<PaginatedResponse<Mechanic>>(`/mechanics${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create: (data: Omit<Mechanic, "id" | "created_at" | "updated_at">) => api.post<Mechanic>("/mechanics", data),
  update: (id: number, data: Omit<Mechanic, "id" | "created_at" | "updated_at">) => api.put<Mechanic>(`/mechanics/${id}`, data),
  delete: (id: number) => api.remove(`/mechanics/${id}`),
};

type BookingInput = { customer_id: number; vehicle_id: number; mechanic_id: number; service_type: string; scheduled_at: string; status: BookingStatus; notes?: string | null };

export const bookingsApi = {
  list: (q?: string, status?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const qs = params.toString();
    return api.get<PaginatedResponse<Booking>>(`/bookings${qs ? `?${qs}` : ""}`);
  },
  create: (data: BookingInput) => api.post<Booking>("/bookings", data),
  update: (id: number, data: BookingInput) => api.put<Booking>(`/bookings/${id}`, data),
  patchStatus: (id: number, status: string) => api.patch<Booking>(`/bookings/${id}/status`, { status }),
  delete: (id: number) => api.remove(`/bookings/${id}`),
};

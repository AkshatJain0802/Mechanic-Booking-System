export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  customer_id: number;
  customer_name?: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  created_at: string;
  updated_at: string;
}

export interface Mechanic {
  id: number;
  name: string;
  specialty: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Booking {
  id: number;
  customer_id: number;
  vehicle_id: number;
  mechanic_id: number;
  service_type: string;
  scheduled_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  mechanic_name?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalVehicles: number;
  totalMechanics: number;
  activeMechanics: number;
  totalBookings: number;
  todayBookings: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  recentBookings: RecentBooking[];
  bookingsByDay: { day: string; count: number }[];
  mechanicWorkload: { name: string; bookings: number; completed: number }[];
}

export interface RecentBooking {
  id: number;
  service_type: string;
  status: BookingStatus;
  scheduled_at: string;
  customer_name: string;
  mechanic_name: string;
  vehicle: string;
}

// Seed script — populates the DB with sample data via the running API.
// Local:  node seed.mjs
// Remote: API_URL=https://your-api.onrender.com/api node seed.mjs

const BASE = process.env.API_URL || "http://localhost:4000/api";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`POST ${path} failed: ${res.status} ${JSON.stringify(err)}`);
  }
  return res.json();
}

// date helper: N days from now at a given hour
function when(daysFromNow, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const customerData = [
  { name: "John Smith", phone: "+1 555 123 4567", email: "john.smith@example.com" },
  { name: "Maria Garcia", phone: "+1 555 234 5678", email: "maria.garcia@example.com" },
  { name: "David Chen", phone: "+1 555 345 6789", email: "david.chen@example.com" },
  { name: "Sarah Johnson", phone: "+1 555 456 7890", email: "sarah.j@example.com" },
  { name: "Michael Brown", phone: "+1 555 567 8901", email: "" },
  { name: "Emily Davis", phone: "+1 555 678 9012", email: "emily.davis@example.com" },
];

const mechanicData = [
  { name: "Alex Johnson", specialty: "Brakes", active: 1 },
  { name: "Carlos Rivera", specialty: "Engine Repair", active: 1 },
  { name: "Priya Patel", specialty: "Electrical", active: 1 },
  { name: "Tom Wilson", specialty: "Transmission", active: 1 },
  { name: "Nina Kowalski", specialty: "Diagnostics", active: 1 },
  { name: "Greg Foster", specialty: "General Maintenance", active: 0 },
];

// vehicles reference customers by index
const vehicleData = [
  { c: 0, make: "Toyota", model: "Camry", year: 2022, license_plate: "ABC-1234" },
  { c: 0, make: "Honda", model: "Civic", year: 2019, license_plate: "JKL-9911" },
  { c: 1, make: "Ford", model: "F-150", year: 2021, license_plate: "DEF-5678" },
  { c: 2, make: "Tesla", model: "Model 3", year: 2023, license_plate: "EV-2023" },
  { c: 3, make: "Chevrolet", model: "Malibu", year: 2018, license_plate: "GHI-3344" },
  { c: 4, make: "BMW", model: "3 Series", year: 2020, license_plate: "BMW-0077" },
  { c: 5, make: "Subaru", model: "Outback", year: 2021, license_plate: "SUB-8080" },
  { c: 1, make: "Jeep", model: "Wrangler", year: 2022, license_plate: "JEEP-444" },
];

// bookings reference customer/vehicle/mechanic by index into created arrays
const bookingData = [
  { c: 0, v: 0, m: 0, service_type: "Brake pad replacement", scheduled_at: when(-3, 10), status: "completed", notes: "Front pads worn, rotors OK" },
  { c: 0, v: 1, m: 4, service_type: "Check engine light diagnostic", scheduled_at: when(-1, 14), status: "completed", notes: "" },
  { c: 1, v: 2, m: 1, service_type: "Oil change & filter", scheduled_at: when(0, 9), status: "in_progress", notes: "Synthetic 5W-30" },
  { c: 2, v: 3, m: 2, service_type: "Battery coolant system check", scheduled_at: when(0, 11), status: "in_progress", notes: "EV coolant loop inspection" },
  { c: 3, v: 4, m: 3, service_type: "Transmission fluid flush", scheduled_at: when(1, 13), status: "pending", notes: "" },
  { c: 4, v: 5, m: 0, service_type: "Brake fluid replacement", scheduled_at: when(2, 10), status: "pending", notes: "Customer reports soft pedal" },
  { c: 5, v: 6, m: 4, service_type: "Pre-purchase inspection", scheduled_at: when(2, 15), status: "pending", notes: "Full 50-point check" },
  { c: 1, v: 7, m: 1, service_type: "Timing belt replacement", scheduled_at: when(3, 9), status: "pending", notes: "" },
  { c: 2, v: 3, m: 2, service_type: "Software update recall", scheduled_at: when(-5, 11), status: "cancelled", notes: "Customer rescheduled" },
  { c: 0, v: 0, m: 3, service_type: "Tire rotation & alignment", scheduled_at: when(4, 14), status: "pending", notes: "" },
];

async function main() {
  console.log("🌱 Seeding sample data...\n");

  const customers = [];
  for (const c of customerData) {
    customers.push(await post("/customers", c));
  }
  console.log(`✓ ${customers.length} customers`);

  const mechanics = [];
  for (const m of mechanicData) {
    mechanics.push(await post("/mechanics", m));
  }
  console.log(`✓ ${mechanics.length} mechanics`);

  const vehicles = [];
  for (const v of vehicleData) {
    vehicles.push(await post("/vehicles", {
      customer_id: customers[v.c].id,
      make: v.make, model: v.model, year: v.year, license_plate: v.license_plate,
    }));
  }
  console.log(`✓ ${vehicles.length} vehicles`);

  let count = 0;
  for (const b of bookingData) {
    await post("/bookings", {
      customer_id: customers[b.c].id,
      vehicle_id: vehicles[b.v].id,
      mechanic_id: mechanics[b.m].id,
      service_type: b.service_type,
      scheduled_at: b.scheduled_at,
      status: b.status,
      notes: b.notes,
    });
    count++;
  }
  console.log(`✓ ${count} bookings`);

  console.log("\n✅ Done! Refresh http://localhost:5173 to see the data.");
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e.message);
  console.error("   Is the server running on http://localhost:4000 ?");
  process.exit(1);
});

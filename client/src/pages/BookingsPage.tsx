import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, LayoutList, Kanban, CalendarDays, User, Car, Wrench } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { bookingsApi, customersApi, vehiclesApi, mechanicsApi, queryKeys } from "../api/queries";
import { ApiError } from "../api/client";
import type { Booking, BookingStatus } from "../types";
import { DataTable } from "../components/ui/DataTable";
import { SlideOver } from "../components/ui/SlideOver";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { BookingStatusBadge } from "../components/ui/Badge";
import { formatDateTime, formatRelative, cn } from "../lib/utils";

const schema = z.object({
  customer_id: z.coerce.number().int().positive("Customer is required"),
  vehicle_id: z.coerce.number().int().positive("Vehicle is required"),
  mechanic_id: z.coerce.number().int().positive("Mechanic is required"),
  service_type: z.string().min(1, "Service type is required").max(200),
  scheduled_at: z.string().min(1, "Scheduled time is required"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const STATUSES: { key: BookingStatus; label: string; color: string; bg: string; border: string }[] = [
  { key: "pending", label: "Pending", color: "text-slate-400", bg: "bg-slate-500/5", border: "border-slate-600/40" },
  { key: "in_progress", label: "In Progress", color: "text-accent-hover", bg: "bg-accent/5", border: "border-accent/25" },
  { key: "completed", label: "Completed", color: "text-slate-100", bg: "bg-slate-400/5", border: "border-slate-500/40" },
  { key: "cancelled", label: "Cancelled", color: "text-slate-500", bg: "bg-slate-700/10", border: "border-slate-700/50" },
];

function KanbanCard({ booking, onEdit, onDelete }: { booking: Booking; onEdit: (b: Booking) => void; onDelete: (b: Booking) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: booking.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-3.5 cursor-grab active:cursor-grabbing group transition-shadow",
        isDragging ? "opacity-40 shadow-2xl" : "hover:border-[var(--color-border-bright)] hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-200 leading-snug">{booking.service_type}</p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(booking); }} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300" aria-label={`Edit booking: ${booking.service_type}`}>
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(booking); }} className="p-1 rounded hover:bg-danger/20 text-slate-500 hover:text-danger" aria-label={`Delete booking: ${booking.service_type}`}>
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <User className="h-3 w-3 shrink-0" /><span className="truncate">{booking.customer_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Car className="h-3 w-3 shrink-0" /><span className="truncate">{booking.vehicle_make} {booking.vehicle_model}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Wrench className="h-3 w-3 shrink-0" /><span className="truncate">{booking.mechanic_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="h-3 w-3 shrink-0" /><span>{formatRelative(booking.scheduled_at)}</span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, bookings, onEdit, onDelete }: { status: typeof STATUSES[number]; bookings: Booking[]; onEdit: (b: Booking) => void; onDelete: (b: Booking) => void }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border p-4 min-h-[200px] gap-3", status.bg, status.border)}>
      <div className="flex items-center justify-between">
        <h3 className={cn("text-sm font-semibold", status.color)}>{status.label}</h3>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", status.bg, status.border, status.color)}>
          {bookings.length}
        </span>
      </div>
      <SortableContext items={bookings.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {bookings.map((b) => (
            <KanbanCard key={b.id} booking={b} onEdit={onEdit} onDelete={onDelete} />
          ))}
          {bookings.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs text-slate-600">No bookings</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function BookingsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);

  const { data, isLoading } = useQuery({ queryKey: queryKeys.bookings(), queryFn: () => bookingsApi.list() });
  const { data: customers } = useQuery({ queryKey: queryKeys.customers(), queryFn: () => customersApi.list() });
  const { data: mechanics } = useQuery({ queryKey: queryKeys.mechanics(), queryFn: () => mechanicsApi.list() });
  const { data: vehicles } = useQuery({
    queryKey: queryKeys.vehicles("", selectedCustomerId || undefined),
    queryFn: () => vehiclesApi.list("", selectedCustomerId || undefined),
  });

  const { register, handleSubmit, reset, setError, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { status: "pending" },
  });

  const watchedCustomerId = watch("customer_id");

  const createMut = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Booking created"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => bookingsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Booking updated"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const patchStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => bookingsApi.patchStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => bookingsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Booking deleted"); setDeleting(null); },
    onError: (e: ApiError) => toast.error(e.message),
  });

  function openCreate() {
    reset({ customer_id: 0, vehicle_id: 0, mechanic_id: 0, service_type: "", scheduled_at: "", status: "pending", notes: "" });
    setSelectedCustomerId(0);
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(b: Booking) {
    const dt = b.scheduled_at ? new Date(b.scheduled_at).toISOString().slice(0, 16) : "";
    reset({ customer_id: b.customer_id, vehicle_id: b.vehicle_id, mechanic_id: b.mechanic_id, service_type: b.service_type, scheduled_at: dt, status: b.status, notes: b.notes || "" });
    setSelectedCustomerId(b.customer_id);
    setEditing(b);
    setDrawerOpen(true);
  }

  function closeDrawer() { setDrawerOpen(false); setEditing(null); reset(); setSelectedCustomerId(0); }

  function onSubmit(d: FormData) {
    if (editing) updateMut.mutate({ id: editing.id, data: d });
    else createMut.mutate(d);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(e: DragStartEvent) {
    const b = data?.data.find((x) => x.id === e.active.id);
    if (b) setActiveBooking(b);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveBooking(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const booking = data?.data.find((x) => x.id === active.id);
    const targetStatus = STATUSES.find((s) => data?.data.filter((x) => x.status === s.key).some((x) => x.id === over.id));
    if (booking && targetStatus && booking.status !== targetStatus.key) {
      patchStatusMut.mutate({ id: booking.id, status: targetStatus.key });
    }
  }

  const bookings = data?.data ?? [];

  const columns: ColumnDef<Booking, unknown>[] = [
    {
      accessorKey: "service_type",
      header: "Service",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">{row.original.service_type}</p>
          <p className="text-xs text-slate-500">{row.original.notes?.slice(0, 40)}{row.original.notes && row.original.notes.length > 40 ? "…" : ""}</p>
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-slate-200">{row.original.customer_name?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-slate-300">{row.original.customer_name}</span>
        </div>
      ),
    },
    {
      id: "vehicle",
      header: "Vehicle",
      accessorFn: (r) => `${r.vehicle_make} ${r.vehicle_model}`,
      cell: ({ row }) => <span className="text-slate-400 text-sm">{row.original.vehicle_make} {row.original.vehicle_model}</span>,
    },
    {
      accessorKey: "mechanic_name",
      header: "Mechanic",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-400">{getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "scheduled_at",
      header: "Scheduled",
      cell: ({ getValue }) => <span className="text-slate-400 text-xs whitespace-nowrap">{formatDateTime(getValue() as string)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <BookingStatusBadge status={getValue() as string} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)} aria-label={`Edit booking: ${row.original.service_type}`}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="text-danger/70 hover:text-danger hover:bg-danger/10" onClick={() => setDeleting(row.original)} aria-label={`Delete booking: ${row.original.service_type}`}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const filteredVehicles = vehicles?.data.filter((v) => !watchedCustomerId || v.customer_id === Number(watchedCustomerId)) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-slate-400 text-sm">{data?.total ?? 0} booking{data?.total !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-lg p-1 gap-1">
            <Button variant={view === "table" ? "primary" : "ghost"} size="sm" onClick={() => setView("table")}>
              <LayoutList className="h-3.5 w-3.5" />Table
            </Button>
            <Button variant={view === "kanban" ? "primary" : "ghost"} size="sm" onClick={() => setView("kanban")}>
              <Kanban className="h-3.5 w-3.5" />Kanban
            </Button>
          </div>
          <Button variant="primary" onClick={openCreate}><Plus className="h-4 w-4" />New Booking</Button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const count = bookings.filter((b) => b.status === s.key).length;
          return (
            <div key={s.key} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium", s.bg, s.border)}>
              <span className={s.color}>{s.label}</span>
              <span className={cn("font-bold", s.color)}>{count}</span>
            </div>
          );
        })}
      </div>

      {view === "table" ? (
        <Card>
          <div className="p-5">
            <DataTable data={bookings} columns={columns} loading={isLoading} searchPlaceholder="Search bookings…" />
          </div>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUSES.map((s) => (
              <KanbanColumn
                key={s.key}
                status={s}
                bookings={bookings.filter((b) => b.status === s.key)}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
          <DragOverlay>
            {activeBooking && (
              <div className="bg-[var(--color-bg-elevated)] border border-accent/30 rounded-xl p-3.5 shadow-2xl shadow-accent/10 rotate-2 scale-105">
                <p className="text-sm font-medium text-slate-200">{activeBooking.service_type}</p>
                <p className="text-xs text-slate-500 mt-1">{activeBooking.customer_name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Booking Drawer */}
      <SlideOver open={drawerOpen} onClose={closeDrawer} title={editing ? "Edit Booking" : "New Booking"} subtitle="Fill in the service details" width="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Customer" error={errors.customer_id?.message} required>
            <Select {...register("customer_id")} error={errors.customer_id?.message}
              onChange={(e) => { setValue("customer_id", Number(e.target.value)); setValue("vehicle_id", 0); setSelectedCustomerId(Number(e.target.value)); }}>
              <option value={0}>Select customer…</option>
              {customers?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle" error={errors.vehicle_id?.message} required>
            <Select {...register("vehicle_id")} error={errors.vehicle_id?.message} disabled={!watchedCustomerId}>
              <option value={0}>Select vehicle…</option>
              {filteredVehicles.map((v) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.license_plate}</option>)}
            </Select>
          </Field>
          <Field label="Mechanic" error={errors.mechanic_id?.message} required>
            <Select {...register("mechanic_id")} error={errors.mechanic_id?.message}>
              <option value={0}>Select mechanic…</option>
              {mechanics?.data.filter((m) => m.active === 1).map((m) => <option key={m.id} value={m.id}>{m.name} — {m.specialty}</option>)}
            </Select>
          </Field>
          <Field label="Service Type" error={errors.service_type?.message} required>
            <Input {...register("service_type")} placeholder="e.g. Oil Change, Brake Inspection" error={errors.service_type?.message} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled At" error={errors.scheduled_at?.message} required>
              <Input {...register("scheduled_at")} type="datetime-local" error={errors.scheduled_at?.message} />
            </Field>
            <Field label="Status" error={errors.status?.message} required>
              <Select {...register("status")}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea {...register("notes")} placeholder="Any additional notes…" />
          </Field>
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeDrawer}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting || createMut.isPending || updateMut.isPending}>
              {editing ? "Save Changes" : "Create Booking"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Booking"
        message={`Remove booking for "${deleting?.service_type}"? This cannot be undone.`}
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

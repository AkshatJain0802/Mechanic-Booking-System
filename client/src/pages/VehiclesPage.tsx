import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Car } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { vehiclesApi, customersApi, queryKeys } from "../api/queries";
import { ApiError } from "../api/client";
import type { Vehicle } from "../types";
import { DataTable } from "../components/ui/DataTable";
import { SlideOver } from "../components/ui/SlideOver";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatRelative } from "../lib/utils";

const currentYear = new Date().getFullYear();

const schema = z.object({
  customer_id: z.coerce.number().int().positive("Customer is required"),
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce.number().int().min(1900, "Invalid year").max(currentYear + 2, "Invalid year"),
  license_plate: z.string().min(1, "License plate is required").max(20),
});
type FormData = z.infer<typeof schema>;

export function VehiclesPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles(),
    queryFn: () => vehiclesApi.list(),
  });

  const { data: customers } = useQuery({
    queryKey: queryKeys.customers(),
    queryFn: () => customersApi.list(),
  });

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const createMut = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Vehicle added"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => vehiclesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Vehicle updated"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => vehiclesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Vehicle deleted"); setDeleting(null); },
    onError: (e: ApiError) => toast.error(e.message),
  });

  function openCreate() { reset({ customer_id: 0, make: "", model: "", year: currentYear, license_plate: "" }); setEditing(null); setDrawerOpen(true); }
  function openEdit(v: Vehicle) { reset({ customer_id: v.customer_id, make: v.make, model: v.model, year: v.year, license_plate: v.license_plate }); setEditing(v); setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); setEditing(null); reset(); }

  function onSubmit(d: FormData) {
    if (editing) updateMut.mutate({ id: editing.id, data: d });
    else createMut.mutate(d);
  }

  const columns: ColumnDef<Vehicle, unknown>[] = [
    {
      id: "vehicle",
      header: "Vehicle",
      accessorFn: (r) => `${r.make} ${r.model}`,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center shrink-0">
            <Car className="h-4 w-4 text-slate-300" />
          </div>
          <div>
            <p className="font-medium text-slate-200">{row.original.year} {row.original.make} {row.original.model}</p>
            <p className="text-xs text-slate-500">{row.original.license_plate}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Owner",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-slate-200">{(getValue() as string)?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-slate-300">{getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ getValue }) => <Badge variant="outline">{getValue() as number}</Badge>,
    },
    {
      accessorKey: "license_plate",
      header: "Plate",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 tracking-wider">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Added",
      cell: ({ getValue }) => <span className="text-slate-500 text-xs">{formatRelative(getValue() as string)}</span>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)} aria-label={`Edit ${row.original.make} ${row.original.model}`}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="text-danger/70 hover:text-danger hover:bg-danger/10" onClick={() => setDeleting(row.original)} aria-label={`Delete ${row.original.make} ${row.original.model}`}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{data?.total ?? 0} vehicle{data?.total !== 1 ? "s" : ""} registered</p>
        <Button variant="primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Vehicle</Button>
      </div>

      <Card>
        <div className="p-5">
          <DataTable data={data?.data ?? []} columns={columns} loading={isLoading} searchPlaceholder="Search vehicles…" />
        </div>
      </Card>

      <SlideOver open={drawerOpen} onClose={closeDrawer} title={editing ? "Edit Vehicle" : "Add Vehicle"} subtitle="Enter vehicle details">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Owner" error={errors.customer_id?.message} required>
            <Select {...register("customer_id")} error={errors.customer_id?.message}>
              <option value={0}>Select customer…</option>
              {customers?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Make" error={errors.make?.message} required>
              <Input {...register("make")} placeholder="Toyota" error={errors.make?.message} autoFocus />
            </Field>
            <Field label="Model" error={errors.model?.message} required>
              <Input {...register("model")} placeholder="Camry" error={errors.model?.message} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year" error={errors.year?.message} required>
              <Input {...register("year")} type="number" placeholder="2023" error={errors.year?.message} />
            </Field>
            <Field label="License Plate" error={errors.license_plate?.message} required>
              <Input {...register("license_plate")} placeholder="ABC-1234" error={errors.license_plate?.message} className="uppercase" />
            </Field>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeDrawer}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting || createMut.isPending || updateMut.isPending}>
              {editing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Vehicle"
        message={`Remove "${deleting?.year} ${deleting?.make} ${deleting?.model}"? This also deletes related bookings.`}
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

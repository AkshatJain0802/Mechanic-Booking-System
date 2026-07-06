import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { mechanicsApi, queryKeys } from "../api/queries";
import { ApiError } from "../api/client";
import type { Mechanic } from "../types";
import { DataTable } from "../components/ui/DataTable";
import { SlideOver } from "../components/ui/SlideOver";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatRelative } from "../lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  specialty: z.string().min(1, "Specialty is required").max(100),
  active: z.coerce.number().int().min(0).max(1),
});
type FormData = z.infer<typeof schema>;

const specialties = ["Engine Repair", "Transmission", "Brakes", "Electrical", "HVAC / AC", "Suspension", "Exhaust", "Diagnostics", "Bodywork", "Tires", "General Maintenance"];

export function MechanicsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Mechanic | null>(null);
  const [deleting, setDeleting] = useState<Mechanic | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.mechanics(),
    queryFn: () => mechanicsApi.list(),
  });

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { active: 1 },
  });

  const createMut = useMutation({
    mutationFn: mechanicsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mechanics"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Mechanic added"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => mechanicsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mechanics"] }); toast.success("Mechanic updated"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => mechanicsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mechanics"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Mechanic removed"); setDeleting(null); },
    onError: (e: ApiError) => toast.error(e.message),
  });

  function openCreate() { reset({ name: "", specialty: "", active: 1 }); setEditing(null); setDrawerOpen(true); }
  function openEdit(m: Mechanic) { reset({ name: m.name, specialty: m.specialty, active: m.active }); setEditing(m); setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); setEditing(null); reset(); }

  function onSubmit(d: FormData) {
    if (editing) updateMut.mutate({ id: editing.id, data: d });
    else createMut.mutate(d);
  }

  const columns: ColumnDef<Mechanic, unknown>[] = [
    {
      accessorKey: "name",
      header: "Mechanic",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent-hover">{row.original.name[0].toUpperCase()}</span>
          </div>
          <span className="font-medium text-slate-200">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "specialty",
      header: "Specialty",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-300">{getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge variant={(getValue() as number) === 1 ? "success" : "default"} dot>
          {(getValue() as number) === 1 ? "Active" : "Inactive"}
        </Badge>
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
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)} aria-label={`Edit ${row.original.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="text-danger/70 hover:text-danger hover:bg-danger/10" onClick={() => setDeleting(row.original)} aria-label={`Delete ${row.original.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const active = data?.data.filter((m) => m.active === 1).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {data?.total ?? 0} mechanic{data?.total !== 1 ? "s" : ""}
          {active > 0 && <span className="text-accent-hover ml-2">· {active} active</span>}
        </p>
        <Button variant="primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Mechanic</Button>
      </div>

      <Card>
        <div className="p-5">
          <DataTable data={data?.data ?? []} columns={columns} loading={isLoading} searchPlaceholder="Search mechanics…" />
        </div>
      </Card>

      <SlideOver open={drawerOpen} onClose={closeDrawer} title={editing ? "Edit Mechanic" : "Add Mechanic"} subtitle="Mechanic roster details">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Full Name" error={errors.name?.message} required>
            <Input {...register("name")} placeholder="Alex Johnson" error={errors.name?.message} autoFocus />
          </Field>
          <Field label="Specialty" error={errors.specialty?.message} required>
            <Select {...register("specialty")} error={errors.specialty?.message}>
              <option value="">Select specialty…</option>
              {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Custom Specialty" hint="Or type a custom specialty above">
            <Input {...register("specialty")} placeholder="e.g. Hybrid Systems" />
          </Field>
          <Field label="Status" error={errors.active?.message} required>
            <Select {...register("active")}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Select>
          </Field>
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeDrawer}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting || createMut.isPending || updateMut.isPending}>
              {editing ? "Save Changes" : "Add Mechanic"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!deleting}
        title="Remove Mechanic"
        message={`Remove "${deleting?.name}" from the roster? Their booking history will also be deleted.`}
        confirmLabel="Remove"
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { customersApi, queryKeys } from "../api/queries";
import { ApiError } from "../api/client";
import type { Customer } from "../types";
import { DataTable } from "../components/ui/DataTable";
import { SlideOver } from "../components/ui/SlideOver";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { formatRelative } from "../lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(30),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export function CustomersPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customers(),
    queryFn: () => customersApi.list(),
  });

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Customer created"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  type CustomerPayload = { name: string; phone: string; email?: string | null };
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerPayload }) => customersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer updated"); closeDrawer(); },
    onError: (e: ApiError) => { if (e.fields) Object.entries(e.fields).forEach(([k, v]) => setError(k as keyof FormData, { message: v })); else toast.error(e.message); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); qc.invalidateQueries({ queryKey: ["stats"] }); toast.success("Customer deleted"); setDeleting(null); },
    onError: (e: ApiError) => toast.error(e.message),
  });

  function openCreate() { reset({ name: "", phone: "", email: "" }); setEditing(null); setDrawerOpen(true); }
  function openEdit(c: Customer) { reset({ name: c.name, phone: c.phone, email: c.email || "" }); setEditing(c); setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); setEditing(null); reset(); }

  function onSubmit(d: FormData) {
    const payload = { name: d.name, phone: d.phone, email: d.email || null };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  }

  const columns: ColumnDef<Customer, unknown>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-slate-200">{row.original.name[0].toUpperCase()}</span>
          </div>
          <span className="font-medium text-slate-200">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>{v}</span>
          </div>
        ) : <span className="text-slate-600 text-xs">—</span>;
      },
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
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)} aria-label={`Edit ${row.original.name}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-danger/70 hover:text-danger hover:bg-danger/10" onClick={() => setDeleting(row.original)} aria-label={`Delete ${row.original.name}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{data?.total ?? 0} customer{data?.total !== 1 ? "s" : ""} registered</p>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <div className="p-5">
          <DataTable data={data?.data ?? []} columns={columns} loading={isLoading} searchPlaceholder="Search customers…" />
        </div>
      </Card>

      <SlideOver open={drawerOpen} onClose={closeDrawer} title={editing ? "Edit Customer" : "Add Customer"} subtitle={editing ? `Editing ${editing.name}` : "Fill in the details below"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Full Name" error={errors.name?.message} required>
            <Input {...register("name")} placeholder="John Smith" error={errors.name?.message} autoFocus />
          </Field>
          <Field label="Phone Number" error={errors.phone?.message} required>
            <Input {...register("phone")} placeholder="+1 (555) 000-0000" error={errors.phone?.message} />
          </Field>
          <Field label="Email Address" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="john@example.com" error={errors.email?.message} />
          </Field>
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeDrawer}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting || createMut.isPending || updateMut.isPending}>
              {editing ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Customer"
        message={`Remove "${deleting?.name}"? This also deletes their vehicles and bookings.`}
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

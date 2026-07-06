import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Users, Car, Wrench, CalendarCheck, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { BookingStatusBadge } from "../components/ui/Badge";
import { statsApi } from "../api/queries";
import { formatDate, formatRelative } from "../lib/utils";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <Card hover className="card-hover">
      <CardContent className="flex items-start gap-4 py-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400">{label}</p>
        <p className="text-accent-hover font-semibold">{payload[0].value} bookings</p>
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="py-5"><div className="skeleton h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardContent className="py-5"><div className="skeleton h-52 w-full" /></CardContent></Card>
          <Card><CardContent className="py-5"><div className="skeleton h-52 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Total Bookings" value={s.totalBookings} sub={`${s.todayBookings} today`} color="bg-accent/15 text-accent-hover" />
        <StatCard icon={Clock} label="Pending" value={s.pending} sub={`${s.in_progress} in progress`} color="bg-slate-700/50 text-slate-200" />
        <StatCard icon={Users} label="Customers" value={s.totalCustomers} sub={`${s.totalVehicles} vehicles`} color="bg-slate-700/50 text-slate-200" />
        <StatCard icon={Wrench} label="Mechanics" value={s.activeMechanics} sub={`${s.totalMechanics} total`} color="bg-slate-700/50 text-slate-200" />
      </div>

      {/* Status row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: s.pending, icon: Clock, color: "text-slate-300", bg: "bg-slate-500/5 border-slate-600/30" },
          { label: "In Progress", value: s.in_progress, icon: TrendingUp, color: "text-accent-hover", bg: "bg-accent/5 border-accent/20" },
          { label: "Completed", value: s.completed, icon: CheckCircle2, color: "text-slate-100", bg: "bg-slate-400/5 border-slate-500/30" },
          { label: "Cancelled", value: s.cancelled, icon: XCircle, color: "text-slate-500", bg: "bg-slate-700/10 border-slate-700/40" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${bg}`}>
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            <div>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bookings trend */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Bookings — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={s.bookingsByDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(v).replace(/\d{4}/, "").trim()} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#amberGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mechanic workload */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mechanic Workload</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.mechanicWorkload} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" }}
                />
                <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="completed" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <a href="/bookings" className="text-xs text-accent-hover hover:text-accent transition-colors">View all →</a>
        </CardHeader>
        <div className="divide-y divide-[var(--color-border)]">
          {s.recentBookings.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">No bookings yet</div>
          ) : s.recentBookings.map((b) => (
            <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-800/20 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Car className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{b.service_type}</p>
                <p className="text-xs text-slate-500 truncate">{b.customer_name} · {b.vehicle}</p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <BookingStatusBadge status={b.status} />
                <span className="text-xs text-slate-600">{formatRelative(b.scheduled_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  CalendarCheck,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/bookings", icon: CalendarCheck, label: "Bookings" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/vehicles", icon: Car, label: "Vehicles" },
  { to: "/mechanics", icon: Wrench, label: "Mechanics" },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "sidebar-gradient h-full flex flex-col border-r border-[var(--color-border)] transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-5 py-5 border-b border-[var(--color-border)]",
        collapsed && "justify-center px-3"
      )}>
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/30">
          <Wrench className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-slate-100 tracking-tight">MechBook</span>
            <span className="block text-xs text-slate-500">Booking System</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 pb-2">
            Navigation
          </p>
        )}
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-accent/10 text-accent-hover shadow-inner"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                collapsed && "justify-center"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
              )}
              <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-accent-hover" : "text-slate-500 group-hover:text-slate-300")} size={18} />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-accent/60" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("px-3 pb-4 pt-3 border-t border-[var(--color-border)]", collapsed && "flex justify-center")}>
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all",
            collapsed && "justify-center"
          )}
        >
          <Settings className="h-4.5 w-4.5 shrink-0 text-slate-500" size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        {!collapsed && (
          <div className="mt-3 mx-0 rounded-xl bg-slate-800/40 border border-slate-700/50 px-3 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-accent-hover">M</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Manager</p>
              <p className="text-xs text-slate-500">admin access</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

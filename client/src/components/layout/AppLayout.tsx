import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Bell, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your shop operations" },
  "/bookings": { title: "Bookings", subtitle: "Manage service appointments" },
  "/customers": { title: "Customers", subtitle: "Customer records and contact info" },
  "/vehicles": { title: "Vehicles", subtitle: "Vehicle registry" },
  "/mechanics": { title: "Mechanics", subtitle: "Mechanic roster and availability" },
  "/settings": { title: "Settings", subtitle: "App preferences" },
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "MechBook", subtitle: "" };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex h-full animate-slide-in-right">
            <Sidebar />
            <button
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={cn(
          "shrink-0 h-14 flex items-center justify-between px-4 sm:px-6",
          "border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/80 backdrop-blur-sm"
        )}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">{page.title}</h1>
              {page.subtitle && <p className="text-xs text-slate-500 hidden sm:block">{page.subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </Button>
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-xs font-bold text-accent-hover">M</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

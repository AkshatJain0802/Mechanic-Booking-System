import { cn } from "../../lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Monochrome corporate badges. Semantic differentiation comes from the text
// label + dot shade; the single accent marks in-progress/active work.
const variants = {
  default: "bg-slate-800 text-slate-300 border-slate-700",
  success: "bg-slate-700/40 text-slate-100 border-slate-600",
  warning: "bg-slate-800 text-slate-400 border-slate-700",
  danger: "bg-slate-800/60 text-slate-500 border-slate-700",
  info: "bg-accent/10 text-accent-hover border-accent/25",
  purple: "bg-slate-800 text-slate-300 border-slate-700",
  outline: "bg-transparent text-slate-300 border-slate-600",
};

const dotColors = {
  default: "bg-slate-400",
  success: "bg-slate-200",
  warning: "bg-slate-500",
  danger: "bg-slate-600",
  info: "bg-accent",
  purple: "bg-slate-400",
  outline: "bg-slate-400",
};

const sizes = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
};

export function Badge({ variant = "default", size = "md", dot, children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center font-medium border rounded-full",
      variants[variant],
      sizes[size],
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    pending: { variant: "warning", label: "Pending" },
    in_progress: { variant: "info", label: "In Progress" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "danger", label: "Cancelled" },
  };
  const cfg = map[status] || { variant: "default", label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

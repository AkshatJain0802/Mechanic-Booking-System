import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  children?: ReactNode;
}

const variants = {
  primary: "bg-accent hover:bg-accent-hover text-white font-semibold shadow-lg shadow-accent/20 active:bg-accent-strong",
  secondary: "bg-slate-700/80 hover:bg-slate-600/80 text-slate-100 border border-slate-600 active:bg-slate-700",
  danger: "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 active:bg-danger/30",
  ghost: "hover:bg-slate-800 text-slate-300 hover:text-slate-100 active:bg-slate-700",
  outline: "border border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 text-slate-300 active:bg-slate-700",
};

const sizes = {
  sm: "h-7 px-3 text-xs rounded-md gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-base rounded-xl gap-2",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({ variant = "secondary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

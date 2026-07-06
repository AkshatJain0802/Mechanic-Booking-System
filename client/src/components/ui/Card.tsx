import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ className, children, hover, glass }: CardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-[var(--color-border)]",
      glass ? "glass" : "bg-[var(--color-bg-elevated)]",
      hover && "card-hover cursor-pointer",
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-4 border-b border-[var(--color-border)]", className)}>{children}</div>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-sm font-semibold text-slate-200", className)}>{children}</h3>;
}

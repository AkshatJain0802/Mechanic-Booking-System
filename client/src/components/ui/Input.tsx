import { useId, cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";
import { cn } from "../../lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

// Renders a <label> associated with its control. The id is generated here and
// injected into the single child control (unless it already has one) so screen
// readers + Lighthouse see a properly labelled input with no per-call wiring.
export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, {
        id: (children as ReactElement<{ id?: string }>).props.id ?? id,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}{required && <span className="text-accent ml-0.5">*</span>}
        </label>
      )}
      {control}
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const inputBase = "w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 disabled:opacity-50 disabled:cursor-not-allowed";
const inputError = "border-danger/60 focus:ring-danger/30 focus:border-danger/60";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}
export function Input({ error, className, id, ...props }: InputProps) {
  const generatedId = useId();
  return (
    <input
      id={id ?? generatedId}
      aria-invalid={error ? true : undefined}
      className={cn(inputBase, error && inputError, className)}
      {...props}
    />
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}
export function Textarea({ error, className, id, ...props }: TextareaProps) {
  const generatedId = useId();
  return (
    <textarea
      id={id ?? generatedId}
      aria-invalid={error ? true : undefined}
      className={cn(inputBase, "resize-none min-h-[90px]", error && inputError, className)}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}
export function Select({ error, className, children, id, ...props }: SelectProps) {
  const generatedId = useId();
  return (
    <select
      id={id ?? generatedId}
      aria-invalid={error ? true : undefined}
      className={cn(inputBase, "cursor-pointer appearance-none bg-[image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")] bg-[right_0.5rem_center] bg-no-repeat bg-[length:20px]", error && inputError, className)}
      {...props}
    >
      {children}
    </select>
  );
}

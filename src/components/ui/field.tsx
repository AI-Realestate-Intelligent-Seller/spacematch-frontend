"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

export const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition " +
  "placeholder:text-muted/70 focus:border-teal focus:ring-3 focus:ring-teal/15 " +
  "disabled:bg-panel-2 disabled:text-muted aria-invalid:border-danger aria-invalid:ring-danger/10";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: (id: string) => ReactNode;
  className?: string;
};

/** Label + control + hint/error, with the ids wired up. */
export function Field({ label, hint, error, children, className = "" }: FieldProps) {
  const id = useId();
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${inputClass} ${className}`} {...rest} />;
}

export function Select({ className = "", ...rest }: ComponentProps<"select">) {
  return <select className={`${inputClass} pr-8 ${className}`} {...rest} />;
}

/** Password input with a Show/Hide toggle. */
export function PasswordInput({ className = "", ...rest }: Omit<ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input type={shown ? "text" : "password"} className={`${inputClass} pr-11 ${className}`} {...rest} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal"
      >
        {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

/** 6-digit code input. */
export function CodeInput({ className = "", ...rest }: ComponentProps<"input">) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      placeholder="123456"
      className={`${inputClass} font-mono text-base tracking-[0.35em] ${className}`}
      {...rest}
    />
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

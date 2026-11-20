import type { ReactNode } from "react";

/** SpaceMatch logo mark + wordmark. */
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-[10px] bg-mint font-black text-white italic ${large ? "size-11 text-2xl" : "size-9 text-xl"}`}
      >
        S
      </span>
      <div className="leading-tight">
        <strong className={`font-bold tracking-[0.05em] ${large ? "text-lg" : "text-base"}`}>
          SPACE<span className="font-normal">MATCH</span>
        </strong>
        <small className="block text-[10px] tracking-[0.25em] text-muted">HUB</small>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, description, actions, children, className = "" }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border-b border-line py-6 last:border-b-0 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-panel p-5 shadow-[0_3px_16px_rgba(23,57,89,0.04)] ${className}`}>{children}</div>;
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-line bg-panel/60 px-6 py-10 text-center text-sm text-muted">
      {icon && <span className="grid size-11 place-items-center rounded-full bg-mint-soft text-mint [&_svg]:size-5">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(23,38,59,0.04)]">
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        {label}
        {icon && <span className="text-teal [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{value}</div>
    </div>
  );
}

/** Grey placeholder block while data loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-panel-2 ${className}`} />;
}

/** Loading placeholder for a whole page: header + a few cards. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-6">
      <Skeleton className="h-3 w-40" />
      <div className="grid gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** A failed page load with a retry button. */
export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="grid justify-items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft/50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-danger">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm font-semibold text-mint hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

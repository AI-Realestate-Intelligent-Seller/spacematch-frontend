import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Hub" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted">
      {all.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden className="text-line">/</span>}
          {i === all.length - 1 ? (
            <strong aria-current="page" className="truncate font-semibold text-ink">
              {c.label}
            </strong>
          ) : c.href ? (
            <Link href={c.href} className="hover:text-mint">
              {c.label}
            </Link>
          ) : (
            <span>{c.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

import { ChevronRight, Eye, Link2 } from "lucide-react";
import Link from "next/link";
import { compact, num } from "@/lib/format";
import type { PropertySummary } from "@/lib/types";
import { AccessTag, Tag } from "@/components/ui/tag";

export function PropertyCard({ property: p }: { property: PropertySummary }) {
  const owner = p.access === "agent";
  return (
    <Link
      href={`/properties/${p.id}`}
      className="group grid gap-4 rounded-2xl border border-line bg-panel p-5 shadow-[0_3px_16px_rgba(23,57,89,0.04)] transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-[0_8px_24px_rgba(23,57,89,0.08)] focus-visible:outline-2 focus-visible:outline-teal"
    >
      <div className="flex items-start justify-between gap-3">
        <strong className="text-[15px] leading-snug group-hover:text-mint">{p.address}</strong>
        <span className="flex shrink-0 items-center gap-1.5">
          {!p.active && <Tag tone="amber">Archived</Tag>}
          {!owner && <AccessTag access={p.access} />}
          <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-mint" aria-hidden />
        </span>
      </div>
      {!owner && <small className="-mt-2 text-xs text-muted">Agent: {p.agent_name ?? "—"}</small>}
      <div className="flex gap-8 border-t border-line pt-4">
        <div>
          <small className="flex items-center gap-1.5 text-xs text-muted">
            <Link2 className="size-3.5" aria-hidden /> Social links
          </small>
          <b className="text-xl tabular-nums">{num(p.reel_count)}</b>
        </div>
        <div>
          <small className="flex items-center gap-1.5 text-xs text-muted">
            <Eye className="size-3.5" aria-hidden /> Views
          </small>
          <b className="text-xl tabular-nums">{compact(p.total_views)}</b>
        </div>
      </div>
    </Link>
  );
}

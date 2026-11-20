import { Clock, ExternalLink, History, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/ui/platform-icon";
import { METRICS, num } from "@/lib/format";
import type { Reel } from "@/lib/types";

type Props = {
  reel: Reel;
  canFetch: boolean;
  canEdit: boolean;
  fetching: boolean;
  onFetch: () => void;
  onHistory: () => void;
  onRemove: () => void;
};

export function ReelCard({ reel: r, canFetch, canEdit, fetching, onFetch, onHistory, onRemove }: Props) {
  const caption = (r.caption || r.permalink || "Reel").slice(0, 180);
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_1px_2px_rgba(23,38,59,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="grid min-w-0 gap-1.5">
          <strong className="truncate text-sm sm:max-w-xl" title={r.caption ?? undefined}>
            {caption}
          </strong>
          <span>
            <PlatformBadge platform={r.platform} />
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canFetch && (
            <Button size="sm" onClick={onFetch} loading={fetching}>
              <RefreshCw aria-hidden /> Fetch
            </Button>
          )}
          <Button size="sm" onClick={onHistory}>
            <History aria-hidden /> History
          </Button>
          {canEdit && (
            <Button size="icon" variant="danger-outline" onClick={onRemove} aria-label="Remove from property" title="Remove from property">
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex min-h-48 flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-page text-center">
          {r.embed_url ? (
            <iframe
              src={r.embed_url}
              title={`${r.platform} reel`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              allowFullScreen
              className="h-60 w-full border-0"
            />
          ) : (
            <p className="px-4 text-xs text-muted">No preview available</p>
          )}
          {r.permalink && (
            <a href={r.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 py-2 text-xs font-semibold text-mint hover:underline">
              Open <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 content-start gap-2.5 sm:grid-cols-4">
          {METRICS.map(([key, label]) => {
            const value = num(r.metrics?.[key]);
            return (
              <div key={key} className="rounded-xl border border-line bg-page px-3 py-2.5">
                <small className="block text-[11px] font-semibold text-muted">{label}</small>
                <strong className={`text-lg tabular-nums ${value === "N/A" ? "text-muted/60" : ""}`}>{value}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {r.metrics_updated_at && (
        <div className="flex items-center gap-1.5 px-5 pb-3.5 text-[11px] text-muted">
          <Clock className="size-3" aria-hidden /> Updated {new Date(r.metrics_updated_at).toLocaleString()}
        </div>
      )}
    </article>
  );
}

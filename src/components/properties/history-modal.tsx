"use client";

import { History } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Empty, LoadError, Skeleton } from "@/components/ui/misc";
import { num } from "@/lib/format";
import type { Metrics } from "@/lib/types";
import { errorMessage, useReelHistoryQuery } from "@/store/api";

const parse = (json: string | null): Partial<Metrics> => {
  try {
    return json ? (JSON.parse(json) as Partial<Metrics>) : {};
  } catch {
    return {};
  }
};

/** Snapshots of one reel's counters, newest first. Render only while open. */
export function HistoryModal({ reelId, onClose }: { reelId: string; onClose: () => void }) {
  const { data, isLoading, isError, error, refetch } = useReelHistoryQuery(reelId, { refetchOnMountOrArgChange: true });
  return (
    <Modal open title="History" onClose={onClose} wide>
      {isLoading ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : isError ? (
        <LoadError message={errorMessage(error)} onRetry={refetch} />
      ) : data?.length ? (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-panel">
              <tr className="text-xs text-muted">
                {["Fetched", "Views", "Likes", "Comments", "Shares"].map((h) => (
                  <th key={h} className="px-2 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((s, i) => {
                const m = parse(s.metrics_json);
                return (
                  <tr key={`${s.fetched_at}-${i}`} className="border-t border-line">
                    <td className="px-2 py-2.5 whitespace-nowrap">{new Date(s.fetched_at).toLocaleString()}</td>
                    <td className="px-2 py-2.5">{num(m.views)}</td>
                    <td className="px-2 py-2.5">{num(m.likes)}</td>
                    <td className="px-2 py-2.5">{num(m.comments)}</td>
                    <td className="px-2 py-2.5">{num(m.shares)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={<History />}>No snapshots yet. Fetch this link to record its first numbers.</Empty>
      )}
    </Modal>
  );
}

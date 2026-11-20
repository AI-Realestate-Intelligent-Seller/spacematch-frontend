"use client";

import { LoaderCircle, MonitorPlay } from "lucide-react";
import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Tag } from "@/components/ui/tag";
import { errorMessage, useScrapeJobQuery } from "@/store/api";

const POLL_MS = 700;

/**
 * Live view of the automated browser while reels are fetched: polls the job until it finishes.
 * `onFinished` runs once, with how many links were updated / failed. Render only while open.
 */
export function LiveViewer({ jobId, onClose, onFinished }: { jobId: string; onClose: () => void; onFinished: (ok: number, failed: number) => void }) {
  const { data: job, isError, error } = useScrapeJobQuery(jobId);
  const running = !isError && (!job || job.status === "running");
  // A second subscription to the same cache entry does the polling, and stops once the job is finished.
  useScrapeJobQuery(jobId, { pollingInterval: running ? POLL_MS : 0, skipPollingIfUnfocused: false });
  const ok = job?.results.filter((r) => r.ok).length ?? 0;
  const failed = (job?.results.length ?? 0) - ok;
  const reported = useRef(false);
  const log = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!job || running || reported.current) return;
    reported.current = true;
    onFinished(ok, failed);
  }, [job, running, ok, failed, onFinished]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [job?.log.length]);

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={
        <span className="flex flex-wrap items-center gap-3">
          <MonitorPlay className="size-5 text-teal" aria-hidden />
          Browser automation
          {isError ? (
            <Tag tone="red">Unavailable</Tag>
          ) : running ? (
            <Tag tone="amber">Running</Tag>
          ) : failed && !ok ? (
            <Tag tone="gray">Failed</Tag>
          ) : (
            <Tag tone="green">Done</Tag>
          )}
          {job && <span className="text-xs font-medium text-muted tabular-nums">{job.elapsed}s</span>}
        </span>
      }
    >
      {isError ? (
        <p className="text-sm text-danger">{errorMessage(error)}</p>
      ) : (
        <>
          {job?.current && <p className="mb-3 truncate text-xs text-muted">{job.current}</p>}
          <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl border border-line bg-[#0f1b2b]">
              {job?.screenshot ? (
                // eslint-disable-next-line @next/next/no-img-element -- live base64 frames from the server
                <img src={job.screenshot} alt="Live view of the automated browser" className="h-full w-full object-contain" />
              ) : (
                <span className="flex items-center gap-2 text-xs text-[#9db0c4]">
                  {running && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                  {running ? "Starting browser…" : "No screenshots for this run"}
                </span>
              )}
            </div>
            <ol ref={log} className="max-h-72 overflow-auto rounded-xl border border-line bg-page p-3 font-mono text-xs leading-relaxed" aria-live="polite">
              {job?.log.map((l, i) => (
                <li key={i} className={/^Saved/.test(l.msg) ? "text-[#0b6b52]" : /^(Failed|Browser error)/.test(l.msg) ? "text-danger" : ""}>
                  <span className="mr-2 text-muted">{l.t.toFixed(1)}s</span>
                  {l.msg}
                </li>
              ))}
            </ol>
          </div>
          {!running && (
            <p className="mt-4 text-sm font-semibold">
              Public fetch finished: {ok} updated{failed ? `, ${failed} failed` : ""}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

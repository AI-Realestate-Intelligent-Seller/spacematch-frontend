"use client";

import { Archive, ArchiveRestore, BarChart3, Download, Eye, Link2, Pencil, Play, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button, LinkButton, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmModal } from "@/components/ui/modal";
import { Empty, LoadError, PageSkeleton, Section, Stat } from "@/components/ui/misc";
import { AccessTag, Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import { compact, num, sumKnown } from "@/lib/format";
import {
  api,
  errorMessage,
  useAddReelMutation,
  useDeletePropertyMutation,
  useEditPropertyMutation,
  useFetchPublicMutation,
  usePropertyQuery,
  useReelsQuery,
  useRemoveReelMutation,
  useSetArchivedMutation,
} from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { HistoryModal } from "./history-modal";
import { LiveViewer } from "./live-viewer";
import { ReelCard } from "./reel-card";

type Confirm = "archive" | "delete" | null;

export function PropertyDetail({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const canShowWindow = useAppSelector((s) => s.auth.canShowWindow);
  const property = usePropertyQuery(id);
  const reels = useReelsQuery(id);

  const [editProperty, editing] = useEditPropertyMutation();
  const [setArchived, archiving] = useSetArchivedMutation();
  const [deleteProperty] = useDeletePropertyMutation();
  const [addReel, adding] = useAddReelMutation();
  const [removeReel] = useRemoveReelMutation();
  const [fetchPublic, starting] = useFetchPublicMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [fetchingReel, setFetchingReel] = useState<string | null>(null);
  const [showWindow, setShowWindow] = useState(false);
  const [newLink, setNewLink] = useState("");

  const onFinished = useCallback(
    (ok: number, failed: number) => {
      toast(`Public fetch finished: ${ok} updated${failed ? `, ${failed} failed` : ""}`, failed > 0 && !ok);
      dispatch(api.util.invalidateTags(["Properties", { type: "Property", id }, { type: "Reels", id }, "History"]));
    },
    [dispatch, id, toast],
  );

  if (property.isLoading || reels.isLoading) return <PageSkeleton cards={2} />;
  if (property.isError || !property.data)
    return (
      <>
        <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: "Property" }]} />
        <LoadError message={errorMessage(property.error)} onRetry={property.refetch} />
      </>
    );

  const prop = property.data;
  const links = reels.data ?? [];
  const owner = prop.access === "agent";
  const editable = owner || prop.access === "full";
  const archived = !prop.active;
  const canFetch = editable && !archived;
  const brokers = prop.brokers ?? [];

  const run = async (action: () => Promise<unknown>, done?: string) => {
    try {
      await action();
      if (done) toast(done);
    } catch (err) {
      toast(errorMessage(err), true);
    }
  };

  const saveAddress = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = String(new FormData(e.currentTarget).get("address")).trim();
    run(async () => {
      await editProperty({ id, address }).unwrap();
      setEditOpen(false);
    }, "Property updated");
  };

  const startFetch = (reelId?: string) =>
    run(async () => {
      setFetchingReel(reelId ?? "all");
      try {
        const r = await fetchPublic({ propertyId: id, showWindow, reelIds: reelId ? [reelId] : undefined }).unwrap();
        setJobId(r.job_id);
      } finally {
        setFetchingReel(null);
      }
    });

  const submitLink = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await addReel({ propertyId: id, url: newLink.trim() }).unwrap();
      setNewLink("");
    }, "Social link added");
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: prop.address }]} />

      <div className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{prop.address}</h1>
          {archived && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
              <Tag tone="amber">Archived</Tag> Daily refresh is paused. Unarchive to fetch again.
            </p>
          )}
          {!owner && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <AccessTag access={prop.access} /> Agent: {prop.agent_name ?? "—"}
            </p>
          )}
        </div>
        {owner && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEditOpen((v) => !v)}>
              <Pencil aria-hidden /> Edit
            </Button>
            <Button
              loading={archiving.isLoading}
              onClick={() => (archived ? run(() => setArchived({ id, archived: false }).unwrap(), "Property unarchived") : setConfirm("archive"))}
            >
              {archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
              {archived ? "Unarchive" : "Archive"}
            </Button>
            <Button variant="danger-outline" onClick={() => setConfirm("delete")}>
              <Trash2 aria-hidden /> Delete
            </Button>
          </div>
        )}
      </div>
      {editOpen && (
        <form onSubmit={saveAddress} className="mt-4 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <Input name="address" required minLength={4} maxLength={240} defaultValue={prop.address} aria-label="Property address" autoFocus />
          <Button type="submit" variant="primary" loading={editing.isLoading}>
            Save
          </Button>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Views" icon={<Eye />} value={compact(sumKnown(links.map((r) => r.metrics?.views)))} />
        <Stat label="Interactions" icon={<BarChart3 />} value={compact(sumKnown(links.flatMap((r) => [r.metrics?.likes, r.metrics?.comments, r.metrics?.shares])))} />
        <Stat label="Social links" icon={<Link2 />} value={num(links.length)} />
        <Stat label="Fetched" icon={<RefreshCw />} value={num(links.filter((r) => r.metrics_updated_at).length)} />
      </div>

      {editable && (
        <Section>
          <form onSubmit={submitLink} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="url"
              required
              aria-label="Reel link"
              placeholder="Paste an Instagram, Facebook, YouTube or TikTok reel link"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
            />
            <Button type="submit" variant="primary" loading={adding.isLoading}>
              <Plus aria-hidden /> Add social link
            </Button>
          </form>
        </Section>
      )}

      {owner && (
        <Section
          title="Brokers"
          actions={
            <LinkButton href={`/brokers?property=${prop.id}`} size="sm">
              <UserPlus aria-hidden /> Invite broker
            </LinkButton>
          }
        >
          {brokers.length ? (
            <div className="flex flex-wrap gap-2">
              {brokers.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-panel py-1 pr-1.5 pl-3 text-[13px] font-semibold">
                  {b.name} <AccessTag access={b.access} />
                  {!b.active && <Tag tone="amber">Invited</Tag>}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No brokers on this property yet.</p>
          )}
        </Section>
      )}

      <Section
        title="Social links"
        actions={
          <>
            {canFetch && (
              <>
                <label
                  className={`flex items-center gap-2 text-xs font-semibold ${canShowWindow ? "text-muted" : "text-muted/50"}`}
                  title={canShowWindow ? undefined : "No screen on the server machine"}
                >
                  <input
                    type="checkbox"
                    checked={showWindow}
                    disabled={!canShowWindow}
                    onChange={(e) => setShowWindow(e.target.checked)}
                    className="size-4 accent-teal"
                  />
                  Show browser window
                </label>
                <Button variant="primary" size="sm" disabled={!links.length} loading={fetchingReel === "all" && starting.isLoading} onClick={() => startFetch()}>
                  <Play aria-hidden /> Fetch all
                </Button>
              </>
            )}
            <a href={`/api/properties/${id}/export.csv`} className={buttonClass("secondary", "sm")} download>
              <Download aria-hidden /> CSV
            </a>
          </>
        }
      >
        {reels.isError ? (
          <LoadError message={errorMessage(reels.error)} onRetry={reels.refetch} />
        ) : links.length ? (
          <div className="grid gap-4">
            {links.map((r) => (
              <ReelCard
                key={r.id}
                reel={r}
                canFetch={canFetch}
                canEdit={editable}
                fetching={fetchingReel === r.id}
                onFetch={() => startFetch(r.id)}
                onHistory={() => setHistoryFor(r.id)}
                onRemove={() => run(() => removeReel({ propertyId: id, reelId: r.id }).unwrap(), "Social link removed")}
              />
            ))}
          </div>
        ) : (
          <Empty icon={<Link2 />}>No social links yet.{editable && " Paste a reel link above."}</Empty>
        )}
      </Section>

      {historyFor && <HistoryModal reelId={historyFor} onClose={() => setHistoryFor(null)} />}
      {jobId && <LiveViewer jobId={jobId} onClose={() => setJobId(null)} onFinished={onFinished} />}

      <ConfirmModal
        open={confirm === "archive"}
        title="Archive property?"
        confirmLabel="Archive"
        onConfirm={() => run(() => setArchived({ id, archived: true }).unwrap(), "Property archived")}
        onClose={() => setConfirm(null)}
      >
        <b>{prop.address}</b> stops being refreshed every day. Its links and history are kept, and you can unarchive it any time.
      </ConfirmModal>
      <ConfirmModal
        open={confirm === "delete"}
        title="Delete property?"
        confirmLabel="Delete property"
        onConfirm={() =>
          run(async () => {
            await deleteProperty(id).unwrap();
            router.replace("/properties");
          }, "Property deleted")
        }
        onClose={() => setConfirm(null)}
      >
        This removes <b>{prop.address}</b>, its social links, metric history and broker access. This can&apos;t be undone.
      </ConfirmModal>
    </>
  );
}

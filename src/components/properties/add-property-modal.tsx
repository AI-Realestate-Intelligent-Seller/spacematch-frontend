"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { PLATFORM_NAME, PlatformIcon } from "@/components/ui/platform-icon";
import { useToast } from "@/components/ui/toast";
import { detectPlatform } from "@/lib/format";
import { errorMessage, useCreatePropertyMutation } from "@/store/api";

type Row = { key: number; url: string; error: string };

/** New property: an address plus one or more reel links (any platform). Render only while open. */
export function AddPropertyModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [create, { isLoading }] = useCreatePropertyMutation();
  const nextKey = useRef(1);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [rows, setRows] = useState<Row[]>([{ key: 0, url: "", error: "" }]);
  const [linksError, setLinksError] = useState("");
  const [formError, setFormError] = useState("");

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { key: nextKey.current++, url: "", error: "" }]);
  const removeRow = (key: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const filled = rows.filter((r) => r.url.trim());
    const badAddress = address.trim().length < 4;
    const checked = rows.map((r) => ({ ...r, error: r.url.trim() && !detectPlatform(r.url) ? "Not an Instagram, Facebook, TikTok or YouTube link." : "" }));
    setAddressError(badAddress ? "Enter the property address (at least 4 characters)." : "");
    setLinksError(filled.length ? "" : "Add at least one reel link.");
    setRows(checked);
    if (badAddress || !filled.length || checked.some((r) => r.error)) return;

    try {
      const p = await create({ address: address.trim(), links: filled.map((r) => r.url.trim()) }).unwrap();
      toast("Property added");
      onClose();
      router.push(`/properties/${p.id}`);
    } catch (err) {
      // The server names a bad link by position: "Link 2: …"
      const message = errorMessage(err);
      const match = /^Link (\d+): (.*)$/.exec(message);
      const row = match ? filled[Number(match[1]) - 1] : undefined;
      if (row && match) update(row.key, { error: match[2] });
      else setFormError(message);
    }
  }

  return (
    <Modal open title="Add property" onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <Field label="Property address" error={addressError}>
          {(id) => (
            <Input
              id={id}
              maxLength={240}
              placeholder="e.g. 1620 N Hoyne Ave, Chicago, IL"
              value={address}
              aria-invalid={!!addressError}
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressError("");
              }}
            />
          )}
        </Field>

        <div className="grid gap-2.5">
          <div>
            <b className="text-sm">Reel links</b>
            <p className="text-xs text-muted">At least one. Add as many as you like, from any platform.</p>
            {linksError && (
              <p role="alert" className="mt-1 text-xs font-semibold text-danger">
                {linksError}
              </p>
            )}
          </div>
          {rows.map((r) => {
            const platform = detectPlatform(r.url);
            return (
              <div key={r.key} className="grid gap-1">
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <span className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${platform ? "text-mint" : "text-muted/60"}`}>
                      {platform ? <PlatformIcon platform={platform} /> : <Plus className="size-4" aria-hidden />}
                    </span>
                    <Input
                      type="url"
                      aria-label="Reel link"
                      placeholder="Paste an Instagram, Facebook, TikTok or YouTube reel link"
                      value={r.url}
                      aria-invalid={!!r.error}
                      className="pl-9"
                      onChange={(e) => update(r.key, { url: e.target.value, error: "" })}
                    />
                  </div>
                  <Button size="icon" variant="ghost" aria-label="Remove link" disabled={rows.length === 1} onClick={() => removeRow(r.key)} className="text-muted!">
                    <X />
                  </Button>
                </div>
                {r.error ? (
                  <p role="alert" className="text-xs font-semibold text-danger">
                    {r.error}
                  </p>
                ) : (
                  r.url.trim() && <p className="text-xs text-muted">{platform ? PLATFORM_NAME[platform] : "Unknown platform"}</p>
                )}
              </div>
            );
          })}
          <Button size="sm" className="justify-self-start" onClick={addRow}>
            <Plus aria-hidden /> Add another link
          </Button>
        </div>

        <FormError>{formError}</FormError>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Create property
          </Button>
        </div>
      </form>
    </Modal>
  );
}

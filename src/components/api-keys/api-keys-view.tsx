"use client";

import { KeyRound, Plus, RotateCw, ShieldAlert, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { CopyRow } from "@/components/brokers/brokers-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { Card, Empty, LoadError, PageHeader, PageSkeleton, Section } from "@/components/ui/misc";
import { Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import { when } from "@/lib/format";
import type { ApiKey, ApiKeyStatus } from "@/lib/types";
import { errorMessage, useApiKeysQuery, useCreateApiKeyMutation, useRevokeApiKeyMutation, useRotateApiKeyMutation } from "@/store/api";

const SCOPES: [string, string][] = [
  ["properties:read", "Read properties"],
  ["properties:write", "Create and edit properties"],
  ["socials:read", "Read links and analytics"],
  ["socials:write", "Set links"],
  ["refresh:write", "Start refreshes"],
  ["logs:read", "Read logs"],
];

const STATUS_TAG: Record<ApiKeyStatus, ReactNode> = {
  active: <Tag tone="green">Active</Tag>,
  expired: <Tag tone="amber">Expired</Tag>,
  revoked: <Tag tone="gray">Revoked</Tag>,
};

type Secret = { title: string; secret: string; note?: string } | null;
type Pending = { kind: "rotate" | "revoke"; key: ApiKey } | null;

export function ApiKeysView() {
  const toast = useToast();
  const keys = useApiKeysQuery();
  const [create, creating] = useCreateApiKeyMutation();
  const [rotate] = useRotateApiKeyMutation();
  const [revoke] = useRevokeApiKeyMutation();
  const [secret, setSecret] = useState<Secret>(null);
  const [pending, setPending] = useState<Pending>(null);

  if (keys.isLoading) return <PageSkeleton cards={1} />;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const scopes = data.getAll("scopes").map(String);
    if (!scopes.length) return toast("Pick at least one scope", true);
    try {
      const k = await create({
        name: String(data.get("name")).trim(),
        environment: data.get("environment") === "preview" ? "preview" : "production",
        scopes,
        expires_in_days: data.get("expires_in_days") ? Number(data.get("expires_in_days")) : null,
      }).unwrap();
      form.reset();
      setSecret({ title: "API key created", secret: k.secret });
    } catch (err) {
      toast(errorMessage(err), true);
    }
  }

  const doRotate = async (key: ApiKey) => {
    try {
      const k = await rotate(key.id).unwrap();
      setSecret({ title: "Key rotated", secret: k.secret, note: " The previous key stops working in 24 hours." });
    } catch (err) {
      toast(errorMessage(err), true);
    }
  };

  const doRevoke = async (key: ApiKey) => {
    try {
      await revoke(key.id).unwrap();
      toast("Key revoked");
    } catch (err) {
      toast(errorMessage(err), true);
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "API keys" }]} />
      <PageHeader
        title="API keys"
        description={
          <>
            The Hub uses an API key to manage your properties and links and to read their analytics through the <code>/v1</code> API. Send it as{" "}
            <code>Authorization: Bearer sk_…</code>. A key can only reach your own properties.
          </>
        }
      />

      <Section title="Create a key">
        <Card>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <Field label="Name">{(id) => <Input id={id} name="name" required minLength={2} maxLength={80} placeholder="e.g. Hub production" />}</Field>
            <Field label="Environment">
              {(id) => (
                <Select id={id} name="environment">
                  <option value="production">Production (sk_live_)</option>
                  <option value="preview">Preview (sk_test_)</option>
                </Select>
              )}
            </Field>
            <Field label="Expires">
              {(id) => (
                <Select id={id} name="expires_in_days">
                  <option value="">Never</option>
                  <option value="30">In 30 days</option>
                  <option value="90">In 90 days</option>
                  <option value="365">In 1 year</option>
                </Select>
              )}
            </Field>
            <fieldset className="grid gap-2 rounded-xl border border-line p-4 sm:grid-cols-2 md:col-span-3 lg:grid-cols-3">
              <legend className="px-1 text-xs font-semibold text-muted">Scopes</legend>
              {SCOPES.map(([scope, label]) => (
                <label key={scope} className="flex items-start gap-2.5 text-sm">
                  <input type="checkbox" name="scopes" value={scope} defaultChecked className="mt-0.5 size-4 accent-teal" />
                  <span>
                    <code className="text-xs font-semibold">{scope}</code>
                    <small className="block text-xs text-muted">{label}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="md:col-span-3">
              <Button type="submit" variant="primary" loading={creating.isLoading}>
                <Plus aria-hidden /> Create key
              </Button>
            </div>
          </form>
        </Card>
      </Section>

      <Section title="Your keys">
        {keys.isError ? (
          <LoadError message={errorMessage(keys.error)} onRetry={keys.refetch} />
        ) : keys.data?.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  {["Name", "Key", "Status", "Last used", "Expires", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.data.map((k) => (
                  <tr key={k.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{k.name}</strong>
                      <small className="mt-0.5 block max-w-xs text-xs text-muted">{k.scopes.join(", ")}</small>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs">{k.prefix}</code>
                    </td>
                    <td className="px-4 py-3">{STATUS_TAG[k.status]}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{when(k.last_used_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{when(k.expires_at)}</td>
                    <td className="px-4 py-3">
                      {k.status !== "revoked" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setPending({ kind: "rotate", key: k })}>
                            <RotateCw aria-hidden /> Rotate
                          </Button>
                          <Button size="sm" variant="danger-outline" onClick={() => setPending({ kind: "revoke", key: k })}>
                            <Trash2 aria-hidden /> Revoke
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<KeyRound />}>No API keys yet. Create one for the Hub above.</Empty>
        )}
      </Section>

      <ConfirmModal
        open={pending?.kind === "rotate"}
        title="Rotate key?"
        confirmLabel="Rotate"
        danger={false}
        onConfirm={() => pending && doRotate(pending.key)}
        onClose={() => setPending(null)}
      >
        A new secret is created. The old one keeps working for <b>24 hours</b> so the Hub can switch over.
      </ConfirmModal>
      <ConfirmModal open={pending?.kind === "revoke"} title="Revoke key?" confirmLabel="Revoke" onConfirm={() => pending && doRevoke(pending.key)} onClose={() => setPending(null)}>
        <b>{pending?.key.name}</b> stops working immediately. Anything using it (like the Hub) will get 401 errors.
      </ConfirmModal>

      <Modal open={!!secret} title={secret?.title} onClose={() => setSecret(null)}>
        <p className="mb-3 flex gap-2.5 rounded-lg border border-[#f0d9a8] bg-[#fff8ea] px-3 py-2.5 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <span>
            Copy this key now and store it in the Hub&apos;s secret settings. <b>It won&apos;t be shown again.</b>
            {secret?.note}
          </span>
        </p>
        <CopyRow value={secret?.secret ?? ""} />
      </Modal>
    </>
  );
}

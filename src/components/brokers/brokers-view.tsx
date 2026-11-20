"use client";

import { Copy, Mail, Send, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { Card, Empty, LoadError, PageHeader, PageSkeleton, Section } from "@/components/ui/misc";
import { Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import type { Broker, BrokerAccess, InviteResult } from "@/lib/types";
import {
  errorMessage,
  useBrokersQuery,
  useChangeBrokerAccessMutation,
  useInviteBrokerMutation,
  usePropertiesQuery,
  useRemoveBrokerMutation,
  useResendInviteMutation,
} from "@/store/api";

type Removal = { broker: Broker; propertyId: string; address: string } | null;
type LinkModal = { title: string; link: string } | null;

export function BrokersView() {
  const toast = useToast();
  const preselect = useSearchParams().get("property") ?? "";
  const brokers = useBrokersQuery();
  const properties = usePropertiesQuery();
  const [invite, inviting] = useInviteBrokerMutation();
  const [resend] = useResendInviteMutation();
  const [changeAccess] = useChangeBrokerAccessMutation();
  const [removeBroker] = useRemoveBrokerMutation();
  const [removal, setRemoval] = useState<Removal>(null);
  const [linkModal, setLinkModal] = useState<LinkModal>(null);
  const [resending, setResending] = useState<string | null>(null);

  if (brokers.isLoading || properties.isLoading) return <PageSkeleton />;

  const own = (properties.data ?? []).filter((p) => p.access === "agent");

  /** The server returns the invite link only when it can't send email; then the agent shares it. */
  const showResult = (r: InviteResult, title: string) => {
    if (r.invite_link) setLinkModal({ title, link: r.invite_link });
    else toast(r.emailed ? `${title} - email sent` : `${title}, but the email could not be sent`, !r.emailed);
  };

  async function submitInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const r = await invite({
        email: String(data.get("email")).trim(),
        name: String(data.get("name") ?? "").trim(),
        brokerage: String(data.get("brokerage") ?? "").trim(),
        property_id: String(data.get("property_id")),
        access: String(data.get("access")) as BrokerAccess,
      }).unwrap();
      form.reset();
      showResult(r, r.pending ? "Invite created" : "Access granted");
    } catch (err) {
      toast(errorMessage(err), true);
    }
  }

  const doResend = async (brokerId: string) => {
    setResending(brokerId);
    try {
      showResult(await resend(brokerId).unwrap(), "Invite re-sent");
    } catch (err) {
      toast(errorMessage(err), true);
    } finally {
      setResending(null);
    }
  };

  const doChangeAccess = async (brokerId: string, propertyId: string, access: BrokerAccess) => {
    try {
      await changeAccess({ brokerId, propertyId, access }).unwrap();
      toast("Access updated");
    } catch (err) {
      toast(errorMessage(err), true);
    }
  };

  const doRemove = async ({ broker, propertyId }: NonNullable<Removal>) => {
    try {
      await removeBroker({ brokerId: broker.id, propertyId }).unwrap();
      toast("Broker removed");
    } catch (err) {
      toast(errorMessage(err), true);
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Brokers" }]} />
      <PageHeader title="Brokers" description="Invite brokers to your properties and choose what they can do." />

      <Section title="Invite a broker" description="They get an email to set their password. Existing brokers are simply given access.">
        {own.length ? (
          <Card>
            <form onSubmit={submitInvite} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto] xl:items-end">
              <Field label="Broker email">{(id) => <Input id={id} name="email" type="email" required autoComplete="off" />}</Field>
              <Field label="Name">{(id) => <Input id={id} name="name" maxLength={120} placeholder="Needed for new brokers" />}</Field>
              <Field label="Brokerage">{(id) => <Input id={id} name="brokerage" maxLength={160} placeholder="Optional" />}</Field>
              <Field label="Property">
                {(id) => (
                  <Select id={id} name="property_id" required defaultValue={own.some((p) => p.id === preselect) ? preselect : undefined}>
                    {own.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.address}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Access">
                {(id) => (
                  <Select id={id} name="access" defaultValue="view">
                    <option value="view">View only</option>
                    <option value="full">Full access</option>
                  </Select>
                )}
              </Field>
              <Button type="submit" variant="primary" loading={inviting.isLoading}>
                <Send aria-hidden /> Send invite
              </Button>
            </form>
          </Card>
        ) : (
          <Empty icon={<Users />}>
            Add a property first, then invite brokers to it.{" "}
            <Link href="/properties" className="font-semibold text-mint hover:underline">
              Go to properties
            </Link>
          </Empty>
        )}
      </Section>

      <Section title="Your brokers">
        {brokers.isError ? (
          <LoadError message={errorMessage(brokers.error)} onRetry={brokers.refetch} />
        ) : brokers.data?.length ? (
          <div className="grid gap-4">
            {brokers.data.map((b) => (
              <Card key={b.id} className="p-0!">
                <div className="flex flex-col gap-3 px-5 pt-4 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-panel-2 text-xs font-bold text-muted">
                      {b.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{b.name}</strong>
                        {b.active ? <Tag tone="green">Active</Tag> : <Tag tone="amber">Invite pending</Tag>}
                      </div>
                      <small className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
                        <Mail className="size-3" aria-hidden />
                        {b.email}
                        {b.brokerage && ` · ${b.brokerage}`}
                      </small>
                    </div>
                  </div>
                  {!b.active && (
                    <Button size="sm" loading={resending === b.id} onClick={() => doResend(b.id)}>
                      <Send aria-hidden /> Resend invite
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {b.properties.map((p) => (
                        <tr key={p.property_id} className="border-t border-line">
                          <td className="px-5 py-2.5">
                            <Link href={`/properties/${p.property_id}`} className="font-semibold text-mint hover:underline">
                              {p.address}
                            </Link>
                          </td>
                          <td className="w-px px-2 py-2.5">
                            <Select
                              aria-label={`Access to ${p.address}`}
                              className="h-9! min-w-36"
                              value={p.access}
                              onChange={(e) => doChangeAccess(b.id, p.property_id, e.target.value as BrokerAccess)}
                            >
                              <option value="view">View only</option>
                              <option value="full">Full access</option>
                            </Select>
                          </td>
                          <td className="w-px py-2.5 pr-5 pl-2">
                            <Button size="sm" variant="danger-outline" onClick={() => setRemoval({ broker: b, propertyId: p.property_id, address: p.address })}>
                              <Trash2 aria-hidden /> Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty icon={<Users />}>No brokers yet. Invite one above.</Empty>
        )}
      </Section>

      <ConfirmModal open={!!removal} title="Remove broker?" confirmLabel="Remove" onConfirm={() => removal && doRemove(removal)} onClose={() => setRemoval(null)}>
        They will lose access to <b>{removal?.address}</b>.
      </ConfirmModal>

      <Modal open={!!linkModal} title={linkModal?.title} onClose={() => setLinkModal(null)}>
        <p className="mb-3 text-sm text-muted">
          Email isn&apos;t configured on the server (SMTP settings in the backend <code>.env</code>), so send this link to the broker yourself:
        </p>
        <CopyRow value={linkModal?.link ?? ""} />
      </Modal>
    </>
  );
}

export function CopyRow({ value }: { value: string }) {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      <Button
        variant="primary"
        onClick={() =>
          navigator.clipboard?.writeText(value).then(
            () => toast("Copied"),
            () => toast("Copy failed - select the text and copy it", true),
          )
        }
      >
        <Copy aria-hidden /> Copy
      </Button>
    </div>
  );
}

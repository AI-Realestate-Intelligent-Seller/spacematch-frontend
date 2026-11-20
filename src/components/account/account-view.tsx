"use client";

import { Mail, MailCheck, Pencil, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useCountdown } from "@/components/auth/recover-flow";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { CodeInput, Field, FormError, Input, PasswordInput } from "@/components/ui/field";
import { Card, LoadError, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import {
  errorMessage,
  useAccountQuery,
  useCancelCodeMutation,
  useChangeLoginEmailMutation,
  useRemoveRecoveryEmailMutation,
  useResendCodeMutation,
  useSetRecoveryEmailMutation,
  useVerifyLoginEmailMutation,
  useVerifyRecoveryEmailMutation,
} from "@/store/api";

type Panel = "login" | "recovery" | "remove" | null;

export function AccountView() {
  const toast = useToast();
  const account = useAccountQuery();
  const [panel, setPanel] = useState<Panel>(null);
  const [setRecovery] = useSetRecoveryEmailMutation();
  const [verifyRecovery] = useVerifyRecoveryEmailMutation();
  const [removeRecovery] = useRemoveRecoveryEmailMutation();
  const [changeLogin] = useChangeLoginEmailMutation();
  const [verifyLogin] = useVerifyLoginEmailMutation();

  if (account.isLoading) return <PageSkeleton cards={2} />;
  if (account.isError || !account.data)
    return (
      <>
        <Breadcrumbs items={[{ label: "Account" }]} />
        <LoadError message={errorMessage(account.error)} onRetry={account.refetch} />
      </>
    );

  const a = account.data;
  const verified = !!a.recovery_email;
  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <>
      <Breadcrumbs items={[{ label: "Account" }]} />
      <PageHeader title="Account" description="Your login details, and how to get back in if you lose access to your email." />

      <div className="grid max-w-3xl gap-5 py-6">
        <Card className="grid gap-4">
          <CardHead icon={<UserRound />} title="Login">
            {!a.pending_login_email && (
              <Button size="sm" onClick={() => toggle("login")}>
                <Pencil aria-hidden /> Change login email
              </Button>
            )}
          </CardHead>
          <Facts
            rows={[
              ["Name", a.name],
              ["Role", a.role === "agent" ? "Agent" : "Broker"],
              ["Login email", a.email],
            ]}
          />
          {a.pending_login_email ? (
            <PendingCode
              kind="email"
              email={a.pending_login_email}
              onVerify={async (code) => {
                await verifyLogin({ code }).unwrap();
                toast("Login email updated");
              }}
            />
          ) : (
            panel === "login" && (
              <EmailPasswordForm
                emailLabel="New login email"
                onSubmit={async (email, password) => {
                  await changeLogin({ email, password }).unwrap();
                  setPanel(null);
                  toast("Code sent to your new email");
                }}
              />
            )
          )}
        </Card>

        <Card className="grid gap-4">
          <CardHead icon={<ShieldCheck />} title="Recovery email">
            {verified ? <Tag tone="green">Verified</Tag> : <Tag tone="amber">Not set</Tag>}
          </CardHead>
          <p className="text-sm leading-relaxed text-muted">
            If you lose access to <b className="text-ink">{a.email}</b> (for example if you leave your company), you can recover your account through this
            address. Use one you&apos;ll keep, like a personal email.
          </p>
          {verified && (
            <>
              <Facts rows={[["Recovery email", a.recovery_email]]} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => toggle("recovery")}>
                  <Pencil aria-hidden /> Change
                </Button>
                <Button size="sm" variant="danger-outline" onClick={() => toggle("remove")}>
                  <Trash2 aria-hidden /> Remove
                </Button>
              </div>
              {panel === "remove" && (
                <PasswordOnlyForm
                  label="Remove recovery email"
                  onSubmit={async (password) => {
                    await removeRecovery({ password }).unwrap();
                    setPanel(null);
                    toast("Recovery email removed");
                  }}
                />
              )}
            </>
          )}
          {a.pending_recovery_email ? (
            <PendingCode
              kind="recovery-email"
              email={a.pending_recovery_email}
              onVerify={async (code) => {
                await verifyRecovery({ code }).unwrap();
                toast("Recovery email verified");
              }}
            />
          ) : (
            (!verified || panel === "recovery") && (
              <EmailPasswordForm
                emailLabel={verified ? "New recovery email" : "Recovery email"}
                placeholder="e.g. your personal email"
                onSubmit={async (email, password) => {
                  const r = await setRecovery({ email, password }).unwrap();
                  setPanel(null);
                  toast(r.same_domain ? "Code sent. Tip: an address at a different domain is safer if you leave your company." : "Code sent - check that inbox");
                }}
              />
            )
          )}
        </Card>
      </div>
    </>
  );
}

function CardHead({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2.5 text-lg font-bold">
        <span className="grid size-8 place-items-center rounded-lg bg-mint-soft text-mint [&_svg]:size-4">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-xs font-semibold text-muted">{k}</dt>
          <dd className="font-semibold break-all">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Runs `action`, keeping its busy flag and error message. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function EmailPasswordForm({ emailLabel, placeholder, onSubmit }: { emailLabel: string; placeholder?: string; onSubmit: (email: string, password: string) => Promise<void> }) {
  const { busy, error, run } = useAction();
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    run(() => onSubmit(String(data.get("email")).trim(), String(data.get("password"))));
  };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={emailLabel}>{(id) => <Input id={id} name="email" type="email" required autoComplete="off" placeholder={placeholder} />}</Field>
        <Field label="Current password">{(id) => <PasswordInput id={id} name="password" required autoComplete="current-password" />}</Field>
        <Button type="submit" variant="primary" loading={busy}>
          <Mail aria-hidden /> Send code
        </Button>
      </div>
      <FormError>{error}</FormError>
    </form>
  );
}

function PasswordOnlyForm({ label, onSubmit }: { label: string; onSubmit: (password: string) => Promise<void> }) {
  const { busy, error, run } = useAction();
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    run(() => onSubmit(password));
  };
  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Current password">{(id) => <PasswordInput id={id} name="password" required autoComplete="current-password" />}</Field>
        <Button type="submit" variant="danger" loading={busy}>
          {label}
        </Button>
      </div>
      <FormError>{error}</FormError>
    </form>
  );
}

/** "We sent a code to X": enter it, resend it (after 60 s) or cancel. */
function PendingCode({ kind, email, onVerify }: { kind: "recovery-email" | "email"; email: string; onVerify: (code: string) => Promise<void> }) {
  const toast = useToast();
  const { busy, error, run } = useAction();
  const [resendIn, startCountdown] = useCountdown(60);
  const [resend, resending] = useResendCodeMutation();
  const [cancel, cancelling] = useCancelCodeMutation();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code")).trim();
    run(() => onVerify(code));
  };
  const doResend = () =>
    run(async () => {
      await resend(kind).unwrap();
      startCountdown();
      toast("New code sent");
    });

  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-teal/50 bg-mint-soft/50 p-4">
      <p className="flex items-start gap-2 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
        <span>
          We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.
        </span>
      </p>
      <form onSubmit={submit} className="flex max-w-sm flex-col gap-2 sm:flex-row">
        <CodeInput name="code" required aria-label="6-digit code" autoFocus />
        <Button type="submit" variant="primary" loading={busy && !resending.isLoading}>
          Verify
        </Button>
      </form>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={resendIn > 0} loading={resending.isLoading} onClick={doResend}>
          {resendIn > 0 ? `Resend code (${resendIn}s)` : "Resend code"}
        </Button>
        <Button size="sm" loading={cancelling.isLoading} onClick={() => run(() => cancel(kind).unwrap())}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

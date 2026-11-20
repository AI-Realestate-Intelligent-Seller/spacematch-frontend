"use client";

import { ArrowRight, LifeBuoy, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { nextPath } from "@/components/layout/guest-gate";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, FormError, Input, PasswordInput } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import {
  errorMessage,
  useAcceptInviteMutation,
  useForgotPasswordMutation,
  useInviteQuery,
  useLoginMutation,
  useLogoutMutation,
  usePasswordResetQuery,
  useResetPasswordMutation,
  useSignupMutation,
  type ApiError,
} from "@/store/api";
import { useAppSelector } from "@/store/store";

export function AuthHeading({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {children && <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export const linkClass = "font-semibold text-mint hover:underline";

const value = (form: FormData, key: string) => String(form.get(key) ?? "");

/* ------------------------------------------------------------------ login -- */

const RECOVER_AFTER_FAILURES = 5;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  const [failures, setFailures] = useState(0);
  const [email, setEmail] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await login({ email: email.trim(), password: value(new FormData(e.currentTarget), "password") }).unwrap();
      router.replace(nextPath(params));
    } catch (err) {
      setError(errorMessage(err));
      setFailures((err as ApiError).failedAttempts ?? 0);
    }
  }

  return (
    <>
      <AuthHeading title="Log in">Agents and invited brokers.</AuthHeading>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <div className="grid gap-1.5">
          <Field label="Password">{(id) => <PasswordInput id={id} name="password" autoComplete="current-password" required />}</Field>
          <Link href="/forgot-password" className={`justify-self-end text-xs ${linkClass}`}>
            Forgot password?
          </Link>
        </div>
        <FormError>{error}</FormError>
        {failures >= RECOVER_AFTER_FAILURES && (
          <div role="alert" className="flex gap-3 rounded-lg border border-[#f0d9a8] bg-[#fff8ea] px-3.5 py-3 text-[13px] leading-relaxed">
            <LifeBuoy className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <p>
              Having trouble logging in? If you can&apos;t get into your email,{" "}
              <Link href={`/recover?email=${encodeURIComponent(email.trim())}`} className={linkClass}>
                recover your account
              </Link>{" "}
              with your recovery email. Or{" "}
              <Link href="/forgot-password" className={linkClass}>
                reset your password
              </Link>
              .
            </p>
          </div>
        )}
        <Button type="submit" variant="primary" loading={isLoading} className="mt-1">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        New agent?{" "}
        <Link href="/signup" className={linkClass}>
          Create an account
        </Link>
        .<br />
        Brokers: use the invite link from your email.
      </p>
    </>
  );
}

/* ----------------------------------------------------------------- signup -- */

export function SignupForm() {
  const router = useRouter();
  const toast = useToast();
  const [signup, { isLoading }] = useSignupMutation();
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (value(data, "password") !== value(data, "confirm")) return setError("Passwords do not match");
    setError("");
    try {
      await signup({ name: value(data, "name").trim(), email: value(data, "email").trim(), password: value(data, "password") }).unwrap();
      toast("Welcome to SpaceMatch!");
      router.replace("/properties");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <AuthHeading title="Create account">Create your agent account.</AuthHeading>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Full name">{(id) => <Input id={id} name="name" autoComplete="name" required minLength={2} maxLength={120} />}</Field>
        <Field label="Email">{(id) => <Input id={id} name="email" type="email" autoComplete="email" required />}</Field>
        <Field label="Password" hint="At least 8 characters.">
          {(id) => <PasswordInput id={id} name="password" autoComplete="new-password" required minLength={8} maxLength={128} />}
        </Field>
        <Field label="Confirm password">{(id) => <PasswordInput id={id} name="confirm" autoComplete="new-password" required minLength={8} />}</Field>
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" loading={isLoading} className="mt-1">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
        .
      </p>
    </>
  );
}

/* -------------------------------------------------------- forgot password -- */

export function ForgotPasswordForm() {
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  const [emailError, setEmailError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEmailError("");
    try {
      const r = await forgot({ email: value(new FormData(e.currentTarget), "email").trim() }).unwrap();
      setSent(r.message);
    } catch (err) {
      // 404: no account uses this email; 409: a broker who hasn't accepted their invite yet.
      const status = (err as ApiError).status;
      if (status === 404 || status === 409) setEmailError(errorMessage(err));
      else setError(errorMessage(err));
    }
  }

  if (sent)
    return (
      <>
        <IconBadge>
          <MailCheck />
        </IconBadge>
        <AuthHeading title="Check your email">{sent} The link works once, for 1 hour.</AuthHeading>
        <LinkButton href="/login">Back to log in</LinkButton>
      </>
    );

  return (
    <>
      <AuthHeading title="Forgot password">Enter your account email and we&apos;ll send you a link to choose a new password.</AuthHeading>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email" error={emailError}>
          {(id) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!emailError}
              onChange={() => emailError && setEmailError("")}
            />
          )}
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" loading={isLoading} className="mt-1">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        Can&apos;t access this email?{" "}
        <Link href="/recover" className={linkClass}>
          Recover your account
        </Link>{" "}
        with your recovery email.
        <br />
        <Link href="/login" className={linkClass}>
          Back to log in
        </Link>
      </p>
    </>
  );
}

export function IconBadge({ children }: { children: ReactNode }) {
  return <span className="mb-4 grid size-11 place-items-center rounded-full bg-mint-soft text-mint [&_svg]:size-5">{children}</span>;
}

/* ------------------------------------------------------ new password forms -- */

function NewPasswordFields({ busy, submitLabel, error }: { busy: boolean; submitLabel: string; error: string }) {
  return (
    <>
      <Field label="New password" hint="At least 8 characters.">
        {(id) => <PasswordInput id={id} name="password" autoComplete="new-password" required minLength={8} maxLength={128} />}
      </Field>
      <Field label="Confirm new password">{(id) => <PasswordInput id={id} name="confirm" autoComplete="new-password" required minLength={8} />}</Field>
      <FormError>{error}</FormError>
      <Button type="submit" variant="primary" loading={busy} className="mt-1">
        {submitLabel}
      </Button>
    </>
  );
}

const FormSkeleton = () => (
  <div role="status" aria-label="Loading" className="grid gap-4">
    <Skeleton className="h-8 w-56" />
    <Skeleton className="h-4 w-72" />
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
  </div>
);

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const reset = usePasswordResetQuery(token);
  const [save, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (value(data, "password") !== value(data, "confirm")) return setError("Passwords do not match");
    setError("");
    try {
      await save({ token, password: value(data, "password") }).unwrap();
      toast("Password updated - you are logged in");
      router.replace("/properties");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (reset.isLoading) return <FormSkeleton />;
  if (reset.isError || !reset.data)
    return (
      <>
        <AuthHeading title="Link unavailable">{errorMessage(reset.error)}</AuthHeading>
        <LinkButton href="/forgot-password" variant="primary">
          Request a new link
        </LinkButton>
      </>
    );

  return (
    <>
      <AuthHeading title="Choose a new password">It must be different from your current password.</AuthHeading>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email">{(id) => <Input id={id} value={reset.data.email} disabled />}</Field>
        <NewPasswordFields busy={isLoading} submitLabel="Set new password" error={error} />
      </form>
    </>
  );
}

export function InviteForm({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const signedInAs = useAppSelector((s) => (s.auth.status === "signed-in" ? s.auth.user : null));
  const invite = useInviteQuery(token, { skip: !!signedInAs });
  const [accept, { isLoading }] = useAcceptInviteMutation();
  const [logout, loggingOut] = useLogoutMutation();
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (value(data, "password") !== value(data, "confirm")) return setError("Passwords do not match");
    setError("");
    try {
      await accept({ token, password: value(data, "password") }).unwrap();
      toast("Your account is ready");
      router.replace("/properties");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (signedInAs)
    return (
      <>
        <AuthHeading title="Invite">
          You&apos;re logged in as <b className="text-ink">{signedInAs.email}</b>. Log out first to accept an invite for another account.
        </AuthHeading>
        <div className="flex flex-wrap gap-2">
          <Button loading={loggingOut.isLoading} onClick={() => logout()}>
            Log out
          </Button>
          <LinkButton href="/properties" variant="primary">
            Go to dashboard <ArrowRight aria-hidden />
          </LinkButton>
        </div>
      </>
    );
  if (invite.isLoading) return <FormSkeleton />;
  if (invite.isError || !invite.data)
    return (
      <>
        <AuthHeading title="Invite unavailable">{errorMessage(invite.error)}</AuthHeading>
        <LinkButton href="/login">Go to login</LinkButton>
      </>
    );

  return (
    <>
      <AuthHeading title={`Welcome, ${invite.data.name}`}>
        {invite.data.invited_by || "An agent"} invited you to SpaceMatch as a broker. Set a password to finish your account.
      </AuthHeading>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email">{(id) => <Input id={id} value={invite.data.email} disabled />}</Field>
        <NewPasswordFields busy={isLoading} submitLabel="Set password & continue" error={error} />
      </form>
    </>
  );
}

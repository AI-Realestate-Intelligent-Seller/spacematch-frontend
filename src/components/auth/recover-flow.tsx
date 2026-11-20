"use client";

import { MailQuestion, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { CodeInput, Field, FormError, Input, PasswordInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  errorMessage,
  useChangeLoginEmailMutation,
  useRecoverMutation,
  useRecoverPasswordMutation,
  useRecoverVerifyMutation,
  useVerifyLoginEmailMutation,
} from "@/store/api";
import { AuthHeading, IconBadge, linkClass } from "./auth-forms";

type Step = "details" | "code" | "password" | "question" | "new-email" | "confirm-email";

const RESEND_SECONDS = 60;

/** Seconds left before another code may be requested. */
export function useCountdown(initial = 0): [number, () => void] {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(RESEND_SECONDS)];
}

/** Steps: login + recovery email -> code -> new password -> "can you reach your login email?" -> (new login email). */
export function RecoverFlow() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [error, setError] = useState("");
  const [resendIn, startCountdown] = useCountdown();
  const newPassword = useRef(""); // kept in memory only, to confirm a login-email change right after recovery

  const [recover, recovering] = useRecoverMutation();
  const [verify, verifying] = useRecoverVerifyMutation();
  const [setPassword, saving] = useRecoverPasswordMutation();
  const [changeEmail, changing] = useChangeLoginEmailMutation();
  const [confirmEmail, confirming] = useVerifyLoginEmailMutation();

  async function attempt(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const go = (next: Step) => {
    setError("");
    setStep(next);
  };

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    attempt(async () => {
      const r = await recover({ email: email.trim(), recovery_email: recoveryEmail.trim() }).unwrap();
      setSentMessage(r.message);
      startCountdown();
      go("code");
    });
  };

  const resend = () =>
    attempt(async () => {
      await recover({ email: email.trim(), recovery_email: recoveryEmail.trim() }).unwrap();
      startCountdown();
      toast("If the details match, a new code is on its way");
    });

  const verifyCode = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code")).trim();
    attempt(async () => {
      await verify({ email: email.trim(), code }).unwrap();
      go("password");
    });
  };

  const savePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    if (password !== data.get("confirm")) return setError("Passwords do not match");
    attempt(async () => {
      await setPassword({ password }).unwrap();
      newPassword.current = password;
      go("question");
    });
  };

  const sendNewEmailCode = (e: FormEvent) => {
    e.preventDefault();
    attempt(async () => {
      await changeEmail({ email: newEmail.trim(), password: newPassword.current }).unwrap();
      go("confirm-email");
    });
  };

  const confirmNewEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code")).trim();
    attempt(async () => {
      await confirmEmail({ code }).unwrap();
      newPassword.current = "";
      toast("Login email updated");
      router.replace("/properties");
    });
  };

  if (step === "details")
    return (
      <>
        <IconBadge>
          <MailQuestion />
        </IconBadge>
        <AuthHeading title="Recover account">
          Can&apos;t get into your login email? Enter it together with the recovery email you verified on your Account page.
          We&apos;ll send a 6-digit code to the recovery email.
        </AuthHeading>
        <form onSubmit={sendCode} className="grid gap-4">
          <Field label="Login email">
            {(id) => <Input id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Recovery email">
            {(id) => <Input id={id} type="email" autoComplete="email" required value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} />}
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" variant="primary" loading={recovering.isLoading} className="mt-1">
            Send code
          </Button>
        </form>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          No recovery email set up?{" "}
          <Link href="/forgot-password" className={linkClass}>
            Reset your password by email
          </Link>{" "}
          instead.
          <br />
          <Link href="/login" className={linkClass}>
            Back to log in
          </Link>
        </p>
      </>
    );

  if (step === "code")
    return (
      <>
        <StepDots step={1} />
        <AuthHeading title="Enter your code">{sentMessage}</AuthHeading>
        <form onSubmit={verifyCode} className="grid gap-4">
          <Field label="6-digit code">{(id) => <CodeInput id={id} name="code" required autoFocus />}</Field>
          <FormError>{error}</FormError>
          <Button type="submit" variant="primary" loading={verifying.isLoading}>
            Continue
          </Button>
        </form>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={resend} disabled={resendIn > 0} loading={recovering.isLoading}>
            {resendIn > 0 ? `Send a new code (${resendIn}s)` : "Send a new code"}
          </Button>
          <Button size="sm" onClick={() => go("details")}>
            Start again
          </Button>
        </div>
      </>
    );

  if (step === "password")
    return (
      <>
        <StepDots step={2} />
        <AuthHeading title="Choose a new password">
          Code accepted. Set a new password for <b className="text-ink">{email}</b> - you have 15 minutes. Other devices will be logged out.
        </AuthHeading>
        <form onSubmit={savePassword} className="grid gap-4">
          <Field label="New password" hint="At least 8 characters.">
            {(id) => <PasswordInput id={id} name="password" autoComplete="new-password" required minLength={8} maxLength={128} autoFocus />}
          </Field>
          <Field label="Confirm new password">{(id) => <PasswordInput id={id} name="confirm" autoComplete="new-password" required minLength={8} />}</Field>
          <FormError>{error}</FormError>
          <Button type="submit" variant="primary" loading={saving.isLoading}>
            Set password &amp; log in
          </Button>
        </form>
      </>
    );

  if (step === "question")
    return (
      <>
        <StepDots step={3} />
        <IconBadge>
          <ShieldCheck />
        </IconBadge>
        <AuthHeading title="You're back in">
          Your password was changed and other devices were logged out. Can you still get into <b className="text-ink">{email}</b>? If not,
          switch your login email to one you can use.
        </AuthHeading>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/properties" variant="primary">
            Yes, go to dashboard
          </LinkButton>
          <Button onClick={() => go("new-email")}>No, change my login email</Button>
        </div>
      </>
    );

  if (step === "new-email")
    return (
      <>
        <StepDots step={3} />
        <AuthHeading title="New login email">We&apos;ll send a code to the new address to confirm it.</AuthHeading>
        <form onSubmit={sendNewEmailCode} className="grid gap-4">
          <Field label="New login email">
            {(id) => <Input id={id} type="email" autoComplete="email" required autoFocus value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />}
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" variant="primary" loading={changing.isLoading}>
            Send code
          </Button>
        </form>
        <p className="mt-6 text-xs text-muted">
          <Link href="/properties" className={linkClass}>
            Skip for now
          </Link>{" "}
          - you can do this later on the Account page.
        </p>
      </>
    );

  return (
    <>
      <StepDots step={3} />
      <AuthHeading title="Confirm new email">
        We sent a 6-digit code to <b className="text-ink">{newEmail}</b>. It expires in 10 minutes.
      </AuthHeading>
      <form onSubmit={confirmNewEmail} className="grid gap-4">
        <Field label="6-digit code">{(id) => <CodeInput id={id} name="code" required autoFocus />}</Field>
        <FormError>{error}</FormError>
        <Button type="submit" variant="primary" loading={confirming.isLoading}>
          Confirm
        </Button>
      </form>
      <p className="mt-6 text-xs text-muted">
        <Link href="/account" className={linkClass}>
          Finish later on the Account page
        </Link>
      </p>
    </>
  );
}

/** "Step 2 of 3" progress for the steps after the first. */
function StepDots({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Code", "New password", "Login email"];
  return (
    <ol aria-label={`Step ${step} of 3`} className="mb-5 flex gap-2">
      {labels.map((label, i) => (
        <li key={label} className="flex-1">
          <span className={`block h-1 rounded-full ${i < step ? "bg-teal" : "bg-line"}`} />
          <span className={`mt-1.5 block text-[11px] font-semibold ${i + 1 === step ? "text-ink" : "text-muted"}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

async function Reset({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <Reset params={params} />
    </Suspense>
  );
}

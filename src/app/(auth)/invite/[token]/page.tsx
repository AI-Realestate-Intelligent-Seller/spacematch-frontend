import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Accept invite" };

async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteForm token={token} />;
}

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <Invite params={params} />
    </Suspense>
  );
}

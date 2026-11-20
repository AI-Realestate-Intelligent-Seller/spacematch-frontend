import type { Metadata } from "next";
import { Suspense } from "react";
import { RecoverFlow } from "@/components/auth/recover-flow";

export const metadata: Metadata = { title: "Recover account" };

export default function RecoverPage() {
  // RecoverFlow reads ?email=, so it renders inside Suspense.
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <RecoverFlow />
    </Suspense>
  );
}

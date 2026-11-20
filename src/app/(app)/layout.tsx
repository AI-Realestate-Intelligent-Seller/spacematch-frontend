import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/ui/misc";

/** Signed-in pages. AppShell reads the URL (active nav, login redirect), so it renders inside Suspense. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:pl-71">
          <PageSkeleton />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

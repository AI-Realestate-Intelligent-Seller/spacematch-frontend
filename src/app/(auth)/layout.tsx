import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";
import { GuestGate } from "@/components/layout/guest-gate";
import { Brand } from "@/components/ui/misc";

/** Logged-out pages: one centered card. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_75%_15%,#dff3ee_0,transparent_45%),linear-gradient(135deg,#f3f8f7,#f6f8fe)] px-4 py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-panel p-7 shadow-[0_25px_70px_rgba(40,79,94,0.1)] sm:p-9">
        <div className="mb-8">
          <Brand large />
        </div>
        <Suspense
          fallback={
            <div className="grid place-items-center py-16 text-muted">
              <LoaderCircle className="size-6 animate-spin" aria-hidden />
            </div>
          }
        >
          <GuestGate>{children}</GuestGate>
        </Suspense>
      </div>
    </main>
  );
}

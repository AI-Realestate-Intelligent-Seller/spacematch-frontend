"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMeQuery } from "@/store/api";
import { useAppSelector } from "@/store/store";

/** Links from emails work whether or not someone is signed in; these pages handle that themselves. */
const OPEN_TO_ALL = ["/invite/", "/reset-password/", "/recover"];

/** Safe in-app path from ?next= (never another site). */
export function nextPath(params: URLSearchParams | null): string {
  const next = params?.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/properties";
}

/**
 * Logged-out pages: sends signed-in users on to the app (except for email-link pages).
 * The page is always rendered (hidden while the session is checked) so Next can validate it.
 */
export function GuestGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  useMeQuery();
  const status = useAppSelector((s) => s.auth.status);
  const open = OPEN_TO_ALL.some((p) => pathname.startsWith(p));
  const leave = status === "signed-in" && !open;
  const waiting = !open && status !== "signed-out";

  useEffect(() => {
    if (leave) router.replace(nextPath(params));
  }, [leave, params, router]);

  return (
    <>
      {waiting && (
        <div role="status" aria-label="Loading" className="grid place-items-center py-16 text-muted">
          <LoaderCircle className="size-6 animate-spin" aria-hidden />
        </div>
      )}
      <div hidden={waiting}>{children}</div>
    </>
  );
}

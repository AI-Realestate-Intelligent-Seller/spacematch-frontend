"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Brand, LoadError, PageSkeleton, Skeleton } from "@/components/ui/misc";
import { Tag } from "@/components/ui/tag";
import type { User } from "@/lib/types";
import { useMeQuery } from "@/store/api";
import { useAppSelector } from "@/store/store";
import { LogoutButton } from "./logout-button";
import { MobileNav, NAV, SidebarNav } from "./nav";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/**
 * Signed-in frame: checks the session, guards agent-only pages, renders sidebar + content.
 *
 * The page is always rendered (hidden until the session is confirmed) rather than swapped for a skeleton:
 * Next validates every page while rendering it, and its data starts loading in parallel with the session check.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isError, refetch } = useMeQuery();
  const { status, user } = useAppSelector((s) => s.auth);
  const agentOnly = NAV.some((n) => n.agentOnly && pathname.startsWith(n.href));
  const blocked = !!user && agentOnly && user.role !== "agent";
  const ready = status === "signed-in" && !!user && !blocked;

  useEffect(() => {
    if (status === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (blocked) router.replace("/properties");
  }, [status, blocked, pathname, router]);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-panel px-4 py-7 lg:flex">
        <Link href="/properties" className="mb-10 px-2">
          <Brand />
        </Link>
        {ready && user ? <SidebarContent user={user} pathname={pathname} /> : <SidebarSkeleton />}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/properties">
              <Brand />
            </Link>
            {ready && <LogoutButton compact />}
          </div>
          {ready && user && (
            <div className="px-4 pb-2">
              <MobileNav role={user.role} pathname={pathname} />
            </div>
          )}
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 lg:px-11 lg:py-8">
          {!ready &&
            (isError && status !== "signed-in" ? (
              <div className="mx-auto max-w-lg py-16">
                <LoadError message="Can't reach the server. Check that the backend is running." onRetry={refetch} />
              </div>
            ) : (
              <PageSkeleton />
            ))}
          <div hidden={!ready}>{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ user, pathname }: { user: User; pathname: string }) {
  return (
    <>
      <SidebarNav role={user.role} pathname={pathname} />
      {/* flex column (not grid): grid items grow to fit unwrapped text and spill out of the 240px sidebar */}
      <div className="mt-auto flex min-w-0 flex-col gap-3 pt-6">
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-page p-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-[13px]" title={user.name}>
              {user.name}
            </strong>
            <small className="block truncate text-xs text-muted" title={user.email}>
              {user.email}
            </small>
            <span className="mt-1.5 block">
              <Tag tone={user.role === "agent" ? "green" : "blue"}>{user.role}</Tag>
            </span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </>
  );
}

function SidebarSkeleton() {
  return (
    <>
      <div className="grid gap-2" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
      <div className="mt-auto grid gap-3 pt-6" aria-hidden>
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-10" />
      </div>
    </>
  );
}

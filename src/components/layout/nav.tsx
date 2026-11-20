"use client";

import { Building2, KeyRound, UserCog, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Role } from "@/lib/types";

export const NAV: { href: string; label: string; icon: LucideIcon; agentOnly: boolean }[] = [
  { href: "/properties", label: "Properties", icon: Building2, agentOnly: false },
  { href: "/brokers", label: "Brokers", icon: Users, agentOnly: true },
  { href: "/api-keys", label: "API keys", icon: KeyRound, agentOnly: true },
  { href: "/account", label: "Account", icon: UserCog, agentOnly: false },
];

export const navFor = (role: Role) => NAV.filter((n) => !n.agentOnly || role === "agent");

export function SidebarNav({ role, pathname }: { role: Role; pathname: string }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navFor(role).map(({ href, label, icon: Icon }) => {
        const current = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              current ? "bg-mint-soft text-mint" : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ role, pathname }: { role: Role; pathname: string }) {
  return (
    <nav aria-label="Mobile navigation" className="-mx-1 flex flex-wrap gap-1 lg:hidden">
      {navFor(role).map(({ href, label, icon: Icon }) => {
        const current = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              current ? "bg-mint-soft text-mint" : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

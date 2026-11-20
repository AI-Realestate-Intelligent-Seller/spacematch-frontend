import type { Access, Metrics, Platform } from "./types";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** 12,345 or N/A */
export const num = (v: number | null | undefined) => (isNum(v) ? v.toLocaleString("en-US") : "N/A");

/** 12.3K or — */
export const compact = (v: number | null | undefined) =>
  isNum(v) ? Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v) : "—";

export const when = (ts: string | null | undefined) => (ts ? new Date(ts).toLocaleString() : "—");

/** Sum of the known values, or null when none are known. */
export const sumKnown = (values: (number | null | undefined)[]) => {
  const known = values.filter(isNum);
  return known.length ? known.reduce((a, b) => a + b, 0) : null;
};

export const METRICS: [keyof Metrics, string][] = [
  ["views", "Views"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["shares", "Shares"],
];

export const ACCESS_LABEL: Record<Access, string> = { agent: "Agent", full: "Full access", view: "View only" };

const PLATFORM_HOSTS: [RegExp, Platform][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)facebook\.com$/, "facebook"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
];

/** Which platform a pasted reel link belongs to (null when unknown or not a URL). */
export function detectPlatform(url: string): Platform | null {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return PLATFORM_HOSTS.find(([re]) => re.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}

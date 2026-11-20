import { Music2 } from "lucide-react";
import type { Platform } from "@/lib/types";

type Props = { platform: Platform; className?: string };

/** Small platform marks (lucide has no brand logos). */
export function PlatformIcon({ platform, className = "size-4" }: Props) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": true as const, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="4" />
          <path d="m10 9 5 3-5 3z" fill="currentColor" />
        </svg>
      );
    default:
      return <Music2 className={className} aria-hidden />;
  }
}

export const PLATFORM_NAME: Record<Platform, string> = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", tiktok: "TikTok" };

const TINT: Record<Platform, string> = {
  instagram: "bg-[#fdeef4] text-[#c13584]",
  facebook: "bg-[#e9f0fd] text-[#1877f2]",
  youtube: "bg-[#fdecec] text-[#e62117]",
  tiktok: "bg-[#eef1f4] text-[#111827]",
};

/** Icon + name pill, e.g. for reel cards. */
export function PlatformBadge({ platform }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TINT[platform]}`}>
      <PlatformIcon platform={platform} className="size-3.5" />
      {PLATFORM_NAME[platform]}
    </span>
  );
}

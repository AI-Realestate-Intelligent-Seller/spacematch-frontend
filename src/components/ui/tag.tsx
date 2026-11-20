import type { ReactNode } from "react";
import { ACCESS_LABEL } from "@/lib/format";
import type { Access } from "@/lib/types";

type Tone = "green" | "amber" | "blue" | "gray" | "red";

const tones: Record<Tone, string> = {
  green: "bg-[#e3f5ef] text-[#0b6b52]",
  amber: "bg-[#fdf1df] text-[#8a520e]",
  blue: "bg-[#e6eefb] text-[#1f4f99]",
  gray: "bg-panel-2 text-muted",
  red: "bg-danger-soft text-danger",
};

export function Tag({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold tracking-wider whitespace-nowrap uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

const ACCESS_TONE: Record<Access, Tone> = { agent: "green", full: "blue", view: "gray" };

export function AccessTag({ access }: { access: Access }) {
  return <Tag tone={ACCESS_TONE[access]}>{ACCESS_LABEL[access]}</Tag>;
}

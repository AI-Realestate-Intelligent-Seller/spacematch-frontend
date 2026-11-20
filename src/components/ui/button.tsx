import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "danger" | "danger-outline" | "ghost";
type Size = "md" | "sm" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold whitespace-nowrap transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal " +
  "disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-mint text-white shadow-[0_1px_2px_rgba(8,126,117,0.25)] hover:bg-[#066b63]",
  secondary: "border-line bg-panel text-ink shadow-[0_1px_2px_rgba(23,38,59,0.04)] hover:border-teal/40 hover:bg-panel-2",
  danger: "border-transparent bg-danger text-white hover:bg-[#93190f]",
  "danger-outline": "border-line bg-panel text-danger hover:border-danger/40 hover:bg-danger-soft",
  ghost: "border-transparent bg-transparent text-mint hover:bg-mint-soft",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm [&_svg]:size-4",
  sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
  icon: "size-8 text-xs [&_svg]:size-4",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant = "secondary", size = "md", loading, className = "", children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {loading && size === "icon" ? null : children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant = "secondary", size = "md", className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

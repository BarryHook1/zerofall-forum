import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    fullWidth?: boolean;
  }
>;

const variants = {
  primary:
    "border border-line-strong bg-zinc-950 text-foreground hover:border-accent/60 hover:bg-zinc-900",
  secondary:
    "border border-line bg-surface text-zinc-200 hover:border-line-strong hover:bg-surface-strong",
  ghost:
    "border border-transparent bg-transparent text-zinc-300 hover:border-line hover:bg-white/[0.03]",
  danger:
    "border border-red-900/60 bg-[#160808] text-red-100 hover:bg-[#221010]",
} as const;

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-[0.9rem] px-5 font-mono text-[13px] uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

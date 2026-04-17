import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line-strong bg-black/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-accent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Table({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableElement>>) {
  return (
    <table
      className={cn("w-full border-separate border-spacing-0 text-sm text-zinc-200", className)}
      {...props}
    >
      {children}
    </table>
  );
}

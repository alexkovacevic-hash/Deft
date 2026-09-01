import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[36rem] border-collapse text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-clay-200 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-clay-100 px-4 py-3 align-middle text-ink-700", className)}>{children}</td>;
}

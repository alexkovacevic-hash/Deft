import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "clay";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  green: "bg-sage-100 text-sage-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  clay: "bg-clay-200 text-clay-800",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const PROJECT_TONES: Record<string, Tone> = {
  LEAD: "blue",
  PROPOSAL: "blue",
  ACTIVE: "green",
  ON_HOLD: "amber",
  COMPLETED: "clay",
  ARCHIVED: "neutral",
};

const SELECTION_TONES: Record<string, Tone> = {
  DRAFT: "neutral",
  PROPOSED: "blue",
  APPROVED: "green",
  REJECTED: "red",
  ORDERED: "amber",
  SHIPPED: "amber",
  DELIVERED: "clay",
  INSTALLED: "green",
};

const INVOICE_TONES: Record<string, Tone> = {
  DRAFT: "neutral",
  SENT: "blue",
  PARTIALLY_PAID: "amber",
  PAID: "green",
  VOID: "red",
};

export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status, kind }: { status: string; kind: "project" | "selection" | "invoice" }) {
  const map = kind === "project" ? PROJECT_TONES : kind === "selection" ? SELECTION_TONES : INVOICE_TONES;
  return <Badge tone={map[status] ?? "neutral"}>{humanizeStatus(status)}</Badge>;
}

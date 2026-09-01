import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prisma Decimal, number, string or null — all reduced to a plain number. */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in (value as object)) {
    return Number((value as { toString(): string }).toString()) || 0;
  }
  return 0;
}

export function formatMoney(value: unknown, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** 95 minutes -> "1h 35m" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Accepts "1.5", "1:30" or "90m" and returns whole minutes. */
export function parseDurationToMinutes(input: string): number | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;
  if (value.includes(":")) {
    const [h, m] = value.split(":");
    const hours = Number(h);
    const mins = Number(m);
    if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
    return Math.round(hours * 60 + mins);
  }
  if (value.endsWith("m")) {
    const mins = Number(value.slice(0, -1));
    return Number.isNaN(mins) ? null : Math.round(mins);
  }
  const hours = Number(value.replace(/h$/, ""));
  if (Number.isNaN(hours)) return null;
  return Math.round(hours * 60);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

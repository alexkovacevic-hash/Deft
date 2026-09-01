"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-clay-200">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
            pathname === tab.href
              ? "border-ink-800 font-medium text-ink-800"
              : "border-transparent text-ink-400 hover:text-ink-700"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export function PortalNav({
  studioName,
  logoUrl,
  items,
  user,
}: {
  studioName: string;
  logoUrl: string | null;
  items: { href: string; label: string; exact?: boolean }[];
  user: { name: string | null; email: string };
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-clay-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/portal" className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={studioName} className="h-8 w-auto" />
          ) : (
            <span className="display text-lg text-ink-900">{studioName}</span>
          )}
        </Link>

        <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "bg-clay-200 font-medium text-ink-800" : "text-ink-500 hover:bg-clay-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Avatar name={user.name ?? user.email} size="sm" />
          <Link href="/api/auth/signout" className="text-xs text-ink-400 hover:text-ink-700">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}

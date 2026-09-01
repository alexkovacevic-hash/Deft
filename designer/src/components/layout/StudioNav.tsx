"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Sofa,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { request } from "@/lib/fetcher";

/** `exact` marks section roots so they only light up on their own page. */
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

const ICONS = {
  dashboard: LayoutDashboard,
  clients: Users,
  projects: ClipboardList,
  selections: Sofa,
  time: Clock,
  invoices: FileText,
  settings: Settings,
};

export function StudioNav({
  items,
  organization,
  organizations,
  user,
  roleName,
}: {
  items: NavItem[];
  organization: { id: string; name: string };
  organizations: { id: string; name: string }[];
  user: { name: string | null; email: string };
  roleName: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  async function switchOrg(id: string) {
    await request("/api/organizations/switch", { body: { organizationId: id } });
    window.location.href = "/studio";
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-ink-800 text-white" : "text-ink-600 hover:bg-clay-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setSwitcherOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-clay-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-800 text-white">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-800">{organization.name}</span>
          <span className="block text-[11px] text-ink-400">{roleName}</span>
        </span>
        {organizations.length > 1 && <ChevronDown className="h-4 w-4 text-ink-400" />}
      </button>
      {switcherOpen && organizations.length > 1 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-clay-200 bg-white py-1 shadow-lg">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => switchOrg(org.id)}
              className={cn(
                "block w-full px-3 py-2 text-left text-sm hover:bg-clay-100",
                org.id === organization.id ? "font-semibold text-ink-800" : "text-ink-600"
              )}
            >
              {org.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="border-t border-clay-200 pt-3">
      <div className="flex items-center gap-2 px-2">
        <Avatar name={user.name ?? user.email} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink-700">{user.name ?? user.email}</p>
          <p className="truncate text-[11px] text-ink-400">{user.email}</p>
        </div>
      </div>
      <Link
        href="/api/auth/signout"
        className="mt-2 block rounded-md px-3 py-2 text-xs text-ink-500 hover:bg-clay-100"
      >
        Sign out
      </Link>
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-clay-200 bg-white px-4 py-3 lg:hidden">
        <span className="display text-base text-ink-900">{organization.name}</span>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5 text-ink-600" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside
            className="flex h-full w-72 flex-col gap-4 bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-ink-500" />
              </button>
            </div>
            {header}
            {nav}
            <div className="mt-auto">{footer}</div>
          </aside>
        </div>
      )}

      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-clay-200 bg-white p-4 lg:flex">
        {header}
        {nav}
        <div className="mt-auto">{footer}</div>
      </aside>
    </>
  );
}

import { requireStudio, can } from "@/lib/tenant";
import { StudioNav, type NavItem } from "@/components/layout/StudioNav";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStudio();

  const items: NavItem[] = [{ href: "/studio", label: "Dashboard", icon: "dashboard", exact: true }];
  if (can(ctx, "clients.view")) items.push({ href: "/studio/clients", label: "Clients", icon: "clients" });
  if (can(ctx, ["projects.view", "projects.view_assigned"])) {
    items.push({ href: "/studio/projects", label: "Projects", icon: "projects" });
  }
  if (can(ctx, "time.log")) items.push({ href: "/studio/time", label: "Time", icon: "time" });
  if (can(ctx, "invoices.view")) items.push({ href: "/studio/invoices", label: "Invoices", icon: "invoices" });
  if (can(ctx, ["settings.manage", "members.manage", "roles.manage"])) {
    items.push({ href: "/studio/settings", label: "Settings", icon: "settings" });
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <StudioNav
        items={items}
        organization={{ id: ctx.organizationId, name: ctx.organization.name }}
        organizations={ctx.organizations}
        user={{ name: ctx.userName, email: ctx.userEmail }}
        roleName={ctx.roleName}
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

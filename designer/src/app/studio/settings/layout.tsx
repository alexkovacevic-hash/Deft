import Link from "next/link";
import { can, requireStudio } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/Card";
import { SettingsTabs } from "./SettingsTabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStudio(["settings.manage", "members.manage", "roles.manage"]);

  const tabs = [
    ...(can(ctx, "settings.manage") ? [{ href: "/studio/settings", label: "Studio" }] : []),
    ...(can(ctx, "members.manage") ? [{ href: "/studio/settings/team", label: "Team" }] : []),
    ...(can(ctx, "roles.manage") ? [{ href: "/studio/settings/roles", label: "Roles" }] : []),
  ];

  return (
    <>
      <PageHeader title="Settings" description={ctx.organization.name} />
      <SettingsTabs tabs={tabs} />
      <div className="mt-6">{children}</div>
      <p className="mt-8 text-xs text-ink-300">
        Need something else? <Link href="/studio" className="hover:underline">Back to the dashboard</Link>
      </p>
    </>
  );
}

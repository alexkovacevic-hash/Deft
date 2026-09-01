import { requirePortal } from "@/lib/tenant";
import { PortalNav } from "@/components/layout/PortalNav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePortal();
  // A household usually belongs to one studio; if several, the first names the header.
  const studio = ctx.access[0];
  const showInvoices = ctx.access.some((a) => a.canViewInvoices);

  return (
    <div className="min-h-screen bg-clay-50">
      <PortalNav
        studioName={studio.organizationName}
        logoUrl={studio.logoUrl}
        user={{ name: ctx.userName, email: ctx.userEmail }}
        items={[
          { href: "/portal", label: "Projects", exact: true },
          ...(showInvoices ? [{ href: "/portal/invoices", label: "Invoices" }] : []),
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

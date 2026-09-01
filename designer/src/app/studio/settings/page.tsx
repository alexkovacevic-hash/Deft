import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/tenant";
import { StudioSettingsForm } from "./StudioSettingsForm";

export default async function StudioSettingsPage() {
  const ctx = await requireStudio("settings.manage");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });

  return (
    <StudioSettingsForm
      organization={{
        name: org.name,
        logoUrl: org.logoUrl ?? "",
        accentColor: org.accentColor,
        currency: org.currency,
        defaultHourlyRate: String(org.defaultHourlyRate),
        invoicePrefix: org.invoicePrefix,
        invoiceTerms: org.invoiceTerms ?? "",
        addressLine1: org.addressLine1 ?? "",
        city: org.city ?? "",
        state: org.state ?? "",
        postalCode: org.postalCode ?? "",
        phone: org.phone ?? "",
        website: org.website ?? "",
      }}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormRow, Input, Label, Textarea } from "@/components/ui/Field";
import { request } from "@/lib/fetcher";

type Settings = {
  name: string;
  logoUrl: string;
  accentColor: string;
  currency: string;
  defaultHourlyRate: string;
  invoicePrefix: string;
  invoiceTerms: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  website: string;
};

export function StudioSettingsForm({ organization }: { organization: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(organization);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set =
    (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function save() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await request("/api/organization", {
        method: "PATCH",
        body: {
          ...form,
          defaultHourlyRate: Number(form.defaultHourlyRate) || 0,
          logoUrl: form.logoUrl || null,
          website: form.website || null,
        },
      });
      setStatus("Saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Studio" description="How your studio appears to clients." />
        <CardBody className="space-y-4">
          <FormRow>
            <div>
              <Label htmlFor="o-name">Studio name</Label>
              <Input id="o-name" value={form.name} onChange={set("name")} />
            </div>
            <div>
              <Label htmlFor="o-logo">Logo URL</Label>
              <Input id="o-logo" value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…" />
            </div>
          </FormRow>
          <FormRow className="sm:grid-cols-3">
            <div>
              <Label htmlFor="o-phone">Phone</Label>
              <Input id="o-phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <Label htmlFor="o-web">Website</Label>
              <Input id="o-web" value={form.website} onChange={set("website")} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="o-accent">Accent colour</Label>
              <Input id="o-accent" value={form.accentColor} onChange={set("accentColor")} placeholder="#0f766e" />
            </div>
          </FormRow>
          <div>
            <Label htmlFor="o-addr">Address</Label>
            <Input id="o-addr" value={form.addressLine1} onChange={set("addressLine1")} />
          </div>
          <FormRow className="sm:grid-cols-3">
            <div>
              <Label htmlFor="o-city">City</Label>
              <Input id="o-city" value={form.city} onChange={set("city")} />
            </div>
            <div>
              <Label htmlFor="o-state">State</Label>
              <Input id="o-state" value={form.state} onChange={set("state")} />
            </div>
            <div>
              <Label htmlFor="o-zip">Postal code</Label>
              <Input id="o-zip" value={form.postalCode} onChange={set("postalCode")} />
            </div>
          </FormRow>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Billing defaults" description="Applied to new time entries and invoices." />
        <CardBody className="space-y-4">
          <FormRow className="sm:grid-cols-3">
            <div>
              <Label htmlFor="o-rate">Default hourly rate</Label>
              <Input
                id="o-rate"
                type="number"
                min="0"
                step="0.01"
                value={form.defaultHourlyRate}
                onChange={set("defaultHourlyRate")}
              />
            </div>
            <div>
              <Label htmlFor="o-cur" hint="ISO code">Currency</Label>
              <Input id="o-cur" maxLength={3} value={form.currency} onChange={set("currency")} />
            </div>
            <div>
              <Label htmlFor="o-prefix">Invoice prefix</Label>
              <Input id="o-prefix" maxLength={10} value={form.invoicePrefix} onChange={set("invoicePrefix")} />
            </div>
          </FormRow>
          <div>
            <Label htmlFor="o-terms">Default invoice terms</Label>
            <Textarea id="o-terms" value={form.invoiceTerms} onChange={set("invoiceTerms")} />
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
        {status && <span className="text-xs text-sage-700">{status}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, FormRow } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { request } from "@/lib/fetcher";

type ClientDraft = {
  id?: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

const EMPTY: ClientDraft = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
};

export function ClientDialogButton({
  client,
  label = "New client",
  variant = "primary",
}: {
  client?: Partial<ClientDraft> & { id: string };
  label?: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientDraft>({ ...EMPTY, ...client });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof ClientDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await request(client ? `/api/clients/${client.id}` : "/api/clients", {
        method: client ? "PATCH" : "POST",
        body: form,
      });
      setOpen(false);
      if (!client) setForm(EMPTY);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the client.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        {!client && <Plus className="h-4 w-4" />}
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={client ? "Edit client" : "New client"}
        description="Households and companies you design for."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy || !form.name.trim()}>
              {busy ? "Saving…" : "Save client"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Client name</Label>
            <Input id="name" value={form.name} onChange={set("name")} placeholder="The Ellsworth Residence" />
          </div>
          <FormRow>
            <div>
              <Label htmlFor="contactName">Primary contact</Label>
              <Input id="contactName" value={form.contactName} onChange={set("contactName")} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} />
            </div>
          </FormRow>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" value={form.addressLine1} onChange={set("addressLine1")} />
          </div>
          <FormRow className="sm:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={set("city")} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={set("state")} />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" value={form.postalCode} onChange={set("postalCode")} />
            </div>
          </FormRow>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={set("notes")} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  );
}

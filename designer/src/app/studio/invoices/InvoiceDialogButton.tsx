"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { request } from "@/lib/fetcher";

type ClientOption = { id: string; name: string; projects: { id: string; name: string }[] };

/** Due in 14 days by default — long enough to be polite, short enough to chase. */
function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

export function InvoiceDialogButton({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: clients[0]?.id ?? "",
    projectId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: defaultDueDate(),
    taxRate: "0",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const projects = useMemo(
    () => clients.find((c) => c.id === form.clientId)?.projects ?? [],
    [clients, form.clientId]
  );

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const { invoice } = await request<{ invoice: { id: string } }>("/api/invoices", {
        body: {
          clientId: form.clientId,
          projectId: form.projectId || null,
          issueDate: form.issueDate,
          dueDate: form.dueDate || null,
          taxRate: Number(form.taxRate) || 0,
          notes: form.notes || null,
        },
      });
      setOpen(false);
      router.push(`/studio/invoices/${invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the invoice.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={clients.length === 0}>
        <Plus className="h-4 w-4" /> New invoice
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New invoice"
        description="Start a draft, then pull in time and items."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={create} disabled={busy || !form.clientId}>
              {busy ? "Creating…" : "Create draft"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <div>
              <Label htmlFor="i-client">Client</Label>
              <Select
                id="i-client"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="i-project" hint="optional">Project</Label>
              <Select
                id="i-project"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </FormRow>
          <FormRow className="sm:grid-cols-3">
            <div>
              <Label htmlFor="i-issue">Issue date</Label>
              <Input
                id="i-issue"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="i-due">Due date</Label>
              <Input
                id="i-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="i-tax" hint="%">Tax rate</Label>
              <Input
                id="i-tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              />
            </div>
          </FormRow>
          <div>
            <Label htmlFor="i-notes">Notes for the client</Label>
            <Textarea id="i-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  );
}

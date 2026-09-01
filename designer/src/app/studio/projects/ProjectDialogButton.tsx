"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { request } from "@/lib/fetcher";

export const PROJECT_STATUSES = [
  { value: "LEAD", label: "Lead" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

type Draft = {
  clientId: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  targetDate: string;
  budget: string;
  hourlyRate: string;
  leadUserId: string;
  visibleToClient: boolean;
};

export function ProjectDialogButton({
  clients,
  members,
  project,
  defaultClientId,
  label = "New project",
  variant = "primary",
  canAddClients = true,
}: {
  clients: { id: string; name: string }[];
  members: { id: string; name: string }[];
  project?: { id: string } & Partial<Draft>;
  defaultClientId?: string;
  label?: string;
  variant?: "primary" | "outline";
  canAddClients?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Draft>({
    clientId: defaultClientId ?? clients[0]?.id ?? "",
    name: "",
    description: "",
    status: "ACTIVE",
    startDate: "",
    targetDate: "",
    budget: "",
    hourlyRate: "",
    leadUserId: "",
    visibleToClient: true,
    ...project,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set =
    (key: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...(project ? {} : { clientId: form.clientId }),
        name: form.name,
        description: form.description || null,
        status: form.status,
        startDate: form.startDate || null,
        targetDate: form.targetDate || null,
        budget: form.budget === "" ? null : Number(form.budget),
        hourlyRate: form.hourlyRate === "" ? null : Number(form.hourlyRate),
        leadUserId: form.leadUserId || null,
        visibleToClient: form.visibleToClient,
      };
      const result = await request<{ project: { id: string } }>(
        project ? `/api/projects/${project.id}` : "/api/projects",
        { method: project ? "PATCH" : "POST", body: payload }
      );
      setOpen(false);
      router.refresh();
      if (!project) router.push(`/studio/projects/${result.project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the project.");
    } finally {
      setBusy(false);
    }
  }

  // A project belongs to a client, so with none on file there is nothing to
  // create against. Point at the step that unblocks it rather than greying out.
  if (!project && clients.length === 0) {
    return canAddClients ? (
      <Link href="/studio/clients">
        <Button size="sm" variant={variant}>
          <Plus className="h-4 w-4" /> Add a client first
        </Button>
      </Link>
    ) : (
      <Button
        size="sm"
        variant={variant}
        disabled
        title="Projects belong to a client, and your role cannot see or add clients."
      >
        {label}
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        {!project && <Plus className="h-4 w-4" />}
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={project ? "Edit project" : "New project"}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy || !form.name.trim() || (!project && !form.clientId)}>
              {busy ? "Saving…" : "Save project"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!project && (
            <div>
              <Label htmlFor="clientId">Client</Label>
              <Select id="clientId" value={form.clientId} onChange={set("clientId")}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="pname">Project name</Label>
            <Input id="pname" value={form.name} onChange={set("name")} placeholder="Whole-home refresh" />
          </div>
          <div>
            <Label htmlFor="description">Scope</Label>
            <Textarea id="description" value={form.description} onChange={set("description")} />
          </div>
          <FormRow>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={form.status} onChange={set("status")}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="leadUserId">Lead designer</Label>
              <Select id="leadUserId" value={form.leadUserId} onChange={set("leadUserId")}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
          </FormRow>
          <FormRow>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" value={form.startDate} onChange={set("startDate")} />
            </div>
            <div>
              <Label htmlFor="targetDate">Target date</Label>
              <Input id="targetDate" type="date" value={form.targetDate} onChange={set("targetDate")} />
            </div>
          </FormRow>
          <FormRow>
            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" min="0" step="0.01" value={form.budget} onChange={set("budget")} />
            </div>
            <div>
              <Label htmlFor="hourlyRate" hint="overrides studio default">Hourly rate</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onChange={set("hourlyRate")}
              />
            </div>
          </FormRow>
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.visibleToClient}
              onChange={(e) => setForm((prev) => ({ ...prev, visibleToClient: e.target.checked }))}
              className="h-4 w-4 rounded border-ink-300"
            />
            Show this project in the client portal
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  );
}

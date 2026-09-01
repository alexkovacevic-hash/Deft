"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FormRow, Input, Label, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { formatMoney } from "@/lib/utils";
import { request } from "@/lib/fetcher";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
  title: string | null;
  hourlyRate: string;
  status: string;
};

export function TeamPanel({
  members,
  roles,
  currency,
  currentUserId,
}: {
  members: Member[];
  roles: { id: string; name: string }[];
  currency: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", roleId: roles[0]?.id ?? "", title: "", hourlyRate: "" });
  const [issued, setIssued] = useState<{ email: string; password: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite() {
    setBusy(true);
    setError(null);
    try {
      const result = await request<{ email: string; oneTimePassword: string | null }>("/api/members", {
        body: {
          name: form.name,
          email: form.email,
          roleId: form.roleId,
          title: form.title || null,
          hourlyRate: form.hourlyRate === "" ? null : Number(form.hourlyRate),
        },
      });
      setIssued({ email: result.email, password: result.oneTimePassword });
      setForm({ name: "", email: "", roleId: roles[0]?.id ?? "", title: "", hourlyRate: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add that person.");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, body: Record<string, unknown>) {
    try {
      await request(`/api/members/${id}`, { method: "PATCH", body });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not update that member.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this person from the studio?")) return;
    try {
      await request(`/api/members/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not remove that member.");
    }
  }

  return (
    <Card>
      <CardHeader
        title="Team"
        description="Who works in the studio, and what each of them can do"
        action={
          <Button size="sm" onClick={() => { setIssued(null); setOpen(true); }}>
            <UserPlus className="h-3.5 w-3.5" /> Add member
          </Button>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Member</Th>
            <Th>Role</Th>
            <Th>Rate</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <Td>
                <span className="flex items-center gap-2">
                  <Avatar name={member.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-800">{member.name}</span>
                    <span className="block text-xs text-ink-400">
                      {member.title ? `${member.title} · ` : ""}{member.email}
                    </span>
                  </span>
                </span>
              </Td>
              <Td>
                <Select
                  value={member.roleId}
                  onChange={(e) => update(member.id, { roleId: e.target.value })}
                  className="h-8 w-auto py-0 text-xs"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </Select>
              </Td>
              <Td className="text-ink-500">
                {member.hourlyRate ? formatMoney(member.hourlyRate, currency) : <span className="text-ink-300">studio default</span>}
              </Td>
              <Td>
                <button
                  type="button"
                  onClick={() =>
                    update(member.id, { status: member.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })
                  }
                >
                  <Badge tone={member.status === "ACTIVE" ? "green" : "neutral"}>
                    {member.status === "ACTIVE" ? "Active" : "Disabled"}
                  </Badge>
                </button>
              </Td>
              <Td className="w-10">
                {member.userId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => remove(member.id)}
                    className="rounded p-1 text-ink-300 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a team member"
        footer={
          issued ? (
            <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={invite} disabled={busy || !form.name.trim() || !form.email.trim()}>
                {busy ? "Adding…" : "Add member"}
              </Button>
            </>
          )
        }
      >
        {issued ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-600"><strong>{issued.email}</strong> is on the team.</p>
            {issued.password ? (
              <div className="rounded-lg border border-clay-200 bg-clay-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <KeyRound className="h-3.5 w-3.5" /> One-time password — shown only now
                </p>
                <p className="mt-1 font-mono text-lg text-ink-900">{issued.password}</p>
              </div>
            ) : (
              <p className="text-xs text-ink-400">They already had an account, so their password is unchanged.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <FormRow>
              <div>
                <Label htmlFor="m-name">Name</Label>
                <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-email">Email</Label>
                <Input
                  id="m-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </FormRow>
            <FormRow className="sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label htmlFor="m-role">Role</Label>
                <Select id="m-role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="m-title">Title</Label>
                <Input id="m-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-rate" hint="optional">Hourly rate</Label>
                <Input
                  id="m-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                />
              </div>
            </FormRow>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </Card>
  );
}

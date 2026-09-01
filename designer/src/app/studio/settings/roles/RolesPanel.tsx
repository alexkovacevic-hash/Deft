"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { request } from "@/lib/fetcher";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isOwnerRole: boolean;
  memberCount: number;
};

type Group = { label: string; permissions: string[] };

export function RolesPanel({
  roles,
  groups,
  catalogue,
}: {
  roles: Role[];
  groups: Group[];
  catalogue: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissions: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startNew() {
    setEditing(null);
    setForm({ name: "", description: "", permissions: [] });
    setError(null);
    setOpen(true);
  }

  function startEdit(role: Role) {
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissions: [...role.permissions],
    });
    setError(null);
    setOpen(true);
  }

  function togglePermission(key: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  }

  function toggleGroup(group: Group, on: boolean) {
    setForm((prev) => ({
      ...prev,
      permissions: on
        ? Array.from(new Set([...prev.permissions, ...group.permissions]))
        : prev.permissions.filter((p) => !group.permissions.includes(p)),
    }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await request(editing ? `/api/roles/${editing.id}` : "/api/roles", {
        method: editing ? "PATCH" : "POST",
        body: {
          name: form.name,
          description: form.description || null,
          // The owner role keeps full access, so its permissions aren't sent.
          ...(editing?.isOwnerRole ? {} : { permissions: form.permissions }),
        },
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that role.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(role: Role) {
    if (!confirm(`Delete the ${role.name} role?`)) return;
    try {
      await request(`/api/roles/${role.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete that role.");
    }
  }

  return (
    <Card>
      <CardHeader
        title="Roles"
        description="Cut permissions however your studio works — a bookkeeper never has to see design work."
        action={
          <Button size="sm" onClick={startNew}>
            <Plus className="h-3.5 w-3.5" /> New role
          </Button>
        }
      />
      <CardBody className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-lg border border-clay-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-ink-800">
                  {role.name}
                  {role.isOwnerRole && (
                    <Badge tone="clay">
                      <Lock className="mr-1 inline h-3 w-3" /> Full access
                    </Badge>
                  )}
                  <Badge tone="neutral">
                    {role.memberCount} member{role.memberCount === 1 ? "" : "s"}
                  </Badge>
                </p>
                {role.description && <p className="mt-0.5 text-xs text-ink-400">{role.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(role)}>Edit</Button>
                {!role.isOwnerRole && (
                  <button
                    type="button"
                    onClick={() => remove(role)}
                    className="rounded p-1.5 text-ink-300 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {role.isOwnerRole ? (
                <span className="text-xs text-ink-400">Every permission, always.</span>
              ) : role.permissions.length === 0 ? (
                <span className="text-xs text-ink-300">No permissions — this role can only sign in.</span>
              ) : (
                role.permissions.map((permission) => (
                  <Badge key={permission} tone="neutral">{catalogue[permission] ?? permission}</Badge>
                ))
              )}
            </div>
          </div>
        ))}
      </CardBody>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? `Edit ${editing.name}` : "New role"}
        description="Pick exactly what this role can reach."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy || form.name.trim().length < 2}>
              {busy ? "Saving…" : "Save role"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="r-name">Role name</Label>
            <Input id="r-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="r-desc">Description</Label>
            <Textarea
              id="r-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {editing?.isOwnerRole ? (
            <p className="rounded-lg border border-clay-200 bg-clay-50 p-3 text-sm text-ink-500">
              The owner role always holds every permission — it&apos;s the way back in if another role gets
              mis-configured. You can still rename it.
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => {
                const all = group.permissions.every((p) => form.permissions.includes(p));
                return (
                  <div key={group.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">{group.label}</h3>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group, !all)}
                        className="text-xs text-clay-700 hover:underline"
                      >
                        {all ? "Clear" : "Select all"}
                      </button>
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-ink-600 hover:bg-clay-50"
                        >
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                            className="mt-0.5 h-4 w-4 rounded border-ink-300"
                          />
                          <span>
                            {catalogue[permission] ?? permission}
                            <span className="block font-mono text-[10px] text-ink-300">{permission}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { request } from "@/lib/fetcher";

type PortalUser = {
  userId: string;
  name: string | null;
  email: string;
  canApproveSelections: boolean;
  canViewInvoices: boolean;
  canPayInvoices: boolean;
};

export function PortalAccessPanel({
  clientId,
  users,
  editable,
}: {
  clientId: string;
  users: PortalUser[];
  editable: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [rights, setRights] = useState({
    canApproveSelections: true,
    canViewInvoices: true,
    canPayInvoices: true,
  });
  const [issued, setIssued] = useState<{ email: string; password: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite() {
    setBusy(true);
    setError(null);
    try {
      const result = await request<{ email: string; oneTimePassword: string | null }>(
        `/api/clients/${clientId}/portal-users`,
        { body: { ...form, ...rights } }
      );
      setIssued({ email: result.email, password: result.oneTimePassword });
      setForm({ name: "", email: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not grant access.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(userId: string, key: keyof Omit<PortalUser, "userId" | "name" | "email">, value: boolean) {
    await request(`/api/clients/${clientId}/portal-users/${userId}`, {
      method: "PATCH",
      body: { [key]: value },
    });
    router.refresh();
  }

  async function revoke(userId: string) {
    if (!confirm("Remove this person's access to the portal?")) return;
    await request(`/api/clients/${clientId}/portal-users/${userId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Portal access"
        description="Who can sign in and follow this client's projects"
        action={
          editable ? (
            <Button size="sm" variant="outline" onClick={() => { setIssued(null); setOpen(true); }}>
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-3">
        {users.length === 0 && <p className="text-sm text-ink-400">Nobody has portal access yet.</p>}
        {users.map((user) => (
          <div key={user.userId} className="flex flex-wrap items-center gap-3 rounded-lg border border-clay-100 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-ink-400">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["canApproveSelections", "Approves"],
                  ["canViewInvoices", "Sees invoices"],
                  ["canPayInvoices", "Pays"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  disabled={!editable}
                  onClick={() => toggle(user.userId, key, !user[key])}
                  className="disabled:cursor-default"
                >
                  <Badge tone={user[key] ? "green" : "neutral"}>{label}</Badge>
                </button>
              ))}
            </div>
            {editable && (
              <button
                type="button"
                onClick={() => revoke(user.userId)}
                className="rounded p-1 text-ink-300 hover:bg-red-50 hover:text-red-600"
                aria-label="Revoke access"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </CardBody>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite to the portal"
        description="They'll sign in at the same address you do."
        footer={
          issued ? (
            <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={invite} disabled={busy || !form.email.trim() || !form.name.trim()}>
                {busy ? "Inviting…" : "Grant access"}
              </Button>
            </>
          )
        }
      >
        {issued ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">
              <strong>{issued.email}</strong> can now sign in.
            </p>
            {issued.password ? (
              <div className="rounded-lg border border-clay-200 bg-clay-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <KeyRound className="h-3.5 w-3.5" /> One-time password — shown only now
                </p>
                <p className="mt-1 font-mono text-lg text-ink-900">{issued.password}</p>
                <p className="mt-1 text-xs text-ink-400">Send it to them over a channel you trust.</p>
              </div>
            ) : (
              <p className="text-xs text-ink-400">They already had a password, so it hasn&apos;t changed.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pu-name">Name</Label>
              <Input id="pu-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="pu-email">Email</Label>
              <Input
                id="pu-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              {(
                [
                  ["canApproveSelections", "Can approve or decline selections"],
                  ["canViewInvoices", "Can see invoices"],
                  ["canPayInvoices", "Can pay invoices online"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={rights[key]}
                    onChange={(e) => setRights({ ...rights, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-ink-300"
                  />
                  {label}
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export type SelectionRow = {
  id: string;
  roomId: string | null;
  name: string;
  vendor: string | null;
  sku: string | null;
  description: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  quantity: number;
  unitCost: string | null;
  unitPrice: string;
  leadTimeWeeks: number | null;
  status: string;
  designerNote: string | null;
  clientNote: string | null;
};

export type RoomRow = { id: string; name: string };

const STATUSES = [
  "DRAFT",
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "ORDERED",
  "SHIPPED",
  "DELIVERED",
  "INSTALLED",
];

const EMPTY = {
  roomId: "",
  name: "",
  vendor: "",
  sku: "",
  description: "",
  productUrl: "",
  imageUrl: "",
  quantity: "1",
  unitCost: "",
  unitPrice: "",
  leadTimeWeeks: "",
  status: "DRAFT",
  designerNote: "",
};

export function SelectionsPanel({
  projectId,
  rooms,
  selections,
  currency,
  editable,
  showCost,
}: {
  projectId: string;
  rooms: RoomRow[];
  selections: SelectionRow[];
  currency: string;
  editable: boolean;
  showCost: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [roomName, setRoomName] = useState("");

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY, roomId: rooms[0]?.id ?? "" });
    setError(null);
    setOpen(true);
  }

  function startEdit(selection: SelectionRow) {
    setEditing(selection.id);
    setForm({
      roomId: selection.roomId ?? "",
      name: selection.name,
      vendor: selection.vendor ?? "",
      sku: selection.sku ?? "",
      description: selection.description ?? "",
      productUrl: selection.productUrl ?? "",
      imageUrl: selection.imageUrl ?? "",
      quantity: String(selection.quantity),
      unitCost: selection.unitCost ?? "",
      unitPrice: selection.unitPrice,
      leadTimeWeeks: selection.leadTimeWeeks == null ? "" : String(selection.leadTimeWeeks),
      status: selection.status,
      designerNote: selection.designerNote ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...(editing ? {} : { projectId }),
        roomId: form.roomId || null,
        name: form.name,
        vendor: form.vendor || null,
        sku: form.sku || null,
        description: form.description || null,
        productUrl: form.productUrl || null,
        imageUrl: form.imageUrl || null,
        quantity: Number(form.quantity) || 1,
        unitCost: form.unitCost === "" ? null : Number(form.unitCost),
        unitPrice: Number(form.unitPrice) || 0,
        leadTimeWeeks: form.leadTimeWeeks === "" ? null : Number(form.leadTimeWeeks),
        status: form.status,
        designerNote: form.designerNote || null,
      };
      await request(editing ? `/api/selections/${editing}` : "/api/selections", {
        method: editing ? "PATCH" : "POST",
        body: payload,
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the selection.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await request(`/api/selections/${id}`, { method: "PATCH", body: { status } });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this selection?")) return;
    await request(`/api/selections/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function addRoom() {
    if (!roomName.trim()) return;
    await request(`/api/projects/${projectId}/rooms`, { body: { name: roomName.trim() } });
    setRoomName("");
    router.refresh();
  }

  /** Everything drafted, sent to the client in one go. */
  async function proposeAllDrafts() {
    const drafts = selections.filter((s) => s.status === "DRAFT");
    if (drafts.length === 0) return;
    if (!confirm(`Send ${drafts.length} draft selection${drafts.length === 1 ? "" : "s"} to the client?`)) return;
    await Promise.all(
      drafts.map((s) => request(`/api/selections/${s.id}`, { method: "PATCH", body: { status: "PROPOSED" } }))
    );
    router.refresh();
  }

  const groups: { room: RoomRow | null; items: SelectionRow[] }[] = [
    ...rooms.map((room) => ({ room, items: selections.filter((s) => s.roomId === room.id) })),
    { room: null, items: selections.filter((s) => !s.roomId) },
  ].filter((g) => g.items.length > 0 || g.room);

  const draftCount = selections.filter((s) => s.status === "DRAFT").length;

  return (
    <Card>
      <CardHeader
        title="Selections"
        description="Items proposed to the client, grouped by room"
        action={
          editable ? (
            <div className="flex gap-2">
              {draftCount > 0 && (
                <Button size="sm" variant="outline" onClick={proposeAllDrafts}>
                  <Send className="h-3.5 w-3.5" /> Send {draftCount} draft{draftCount === 1 ? "" : "s"}
                </Button>
              )}
              <Button size="sm" onClick={startNew}>
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
          ) : undefined
        }
      />
      <CardBody className="space-y-6">
        {editable && (
          <div className="flex gap-2">
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Add a room — Living room, Primary bath…"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRoom();
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={addRoom} disabled={!roomName.trim()}>
              Add room
            </Button>
          </div>
        )}

        {selections.length === 0 && (
          <p className="text-sm text-ink-400">No selections yet. Add the first item you want to present.</p>
        )}

        {groups.map(({ room, items }) => (
          <div key={room?.id ?? "unassigned"}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              {room?.name ?? "Unassigned"}
            </h3>
            {items.length === 0 ? (
              <p className="text-xs text-ink-300">Nothing in this room yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((selection) => (
                  <div key={selection.id} className="flex gap-3 rounded-lg border border-clay-100 p-3">
                    {selection.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selection.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-800">
                            {selection.name}
                            {selection.productUrl && (
                              <a
                                href={selection.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 inline-block text-ink-300 hover:text-clay-700"
                              >
                                <ExternalLink className="inline h-3 w-3" />
                              </a>
                            )}
                          </p>
                          <p className="text-xs text-ink-400">
                            {[selection.vendor, selection.sku].filter(Boolean).join(" · ") || "—"}
                            {selection.leadTimeWeeks ? ` · ${selection.leadTimeWeeks} wk lead` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={selection.status} kind="selection" />
                          {editable && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(selection)}
                                className="rounded p-1 text-ink-300 hover:bg-clay-100 hover:text-ink-700"
                                aria-label="Edit selection"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(selection.id)}
                                className="rounded p-1 text-ink-300 hover:bg-red-50 hover:text-red-600"
                                aria-label="Delete selection"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {selection.description && (
                        <p className="mt-1 text-xs text-ink-500">{selection.description}</p>
                      )}
                      {selection.clientNote && (
                        <p className="mt-1 rounded bg-clay-50 px-2 py-1 text-xs text-clay-800">
                          Client: {selection.clientNote}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                        <span>
                          {selection.quantity} × {formatMoney(selection.unitPrice, currency)} ={" "}
                          <strong className="text-ink-800">
                            {formatMoney(selection.quantity * Number(selection.unitPrice), currency)}
                          </strong>
                        </span>
                        {showCost && selection.unitCost && (
                          <span className="text-ink-300">
                            cost {formatMoney(selection.unitCost, currency)} · margin{" "}
                            {formatMoney(
                              selection.quantity * (Number(selection.unitPrice) - Number(selection.unitCost)),
                              currency
                            )}
                          </span>
                        )}
                        {editable && (
                          <Select
                            value={selection.status}
                            onChange={(e) => setStatus(selection.id, e.target.value)}
                            className="h-7 w-auto py-0 text-xs"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                            ))}
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardBody>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? "Edit selection" : "Add a selection"}
        description="What you present to the client — price is what they pay."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy || !form.name.trim()}>
              {busy ? "Saving…" : "Save item"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <div>
              <Label htmlFor="s-name">Item</Label>
              <Input id="s-name" value={form.name} onChange={set("name")} placeholder="Ludlow sofa, 96&quot;" />
            </div>
            <div>
              <Label htmlFor="s-room">Room</Label>
              <Select id="s-room" value={form.roomId} onChange={set("roomId")}>
                <option value="">Unassigned</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </Select>
            </div>
          </FormRow>
          <FormRow>
            <div>
              <Label htmlFor="s-vendor">Vendor</Label>
              <Input id="s-vendor" value={form.vendor} onChange={set("vendor")} />
            </div>
            <div>
              <Label htmlFor="s-sku">SKU</Label>
              <Input id="s-sku" value={form.sku} onChange={set("sku")} />
            </div>
          </FormRow>
          <div>
            <Label htmlFor="s-url">Product page</Label>
            <Input id="s-url" value={form.productUrl} onChange={set("productUrl")} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="s-image">Image URL</Label>
            <Input id="s-image" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="s-desc">Description for the client</Label>
            <Textarea id="s-desc" value={form.description} onChange={set("description")} />
          </div>
          <FormRow className="sm:grid-cols-4">
            <div>
              <Label htmlFor="s-qty">Qty</Label>
              <Input id="s-qty" type="number" min="1" value={form.quantity} onChange={set("quantity")} />
            </div>
            <div>
              <Label htmlFor="s-cost" hint="internal">Unit cost</Label>
              <Input id="s-cost" type="number" min="0" step="0.01" value={form.unitCost} onChange={set("unitCost")} />
            </div>
            <div>
              <Label htmlFor="s-price">Unit price</Label>
              <Input id="s-price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={set("unitPrice")} />
            </div>
            <div>
              <Label htmlFor="s-lead" hint="weeks">Lead time</Label>
              <Input id="s-lead" type="number" min="0" value={form.leadTimeWeeks} onChange={set("leadTimeWeeks")} />
            </div>
          </FormRow>
          <FormRow>
            <div>
              <Label htmlFor="s-status">Status</Label>
              <Select id="s-status" value={form.status} onChange={set("status")}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="s-note" hint="internal">Designer note</Label>
              <Input id="s-note" value={form.designerNote} onChange={set("designerNote")} />
            </div>
          </FormRow>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </Card>
  );
}

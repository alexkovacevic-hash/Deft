"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Download, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatDate, formatDuration, formatMoney } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export type LineItem = {
  id: string;
  kind: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

export type BillableTime = {
  id: string;
  workDate: string;
  minutes: number;
  description: string;
  hourlyRate: string;
  projectName: string;
};

export type BillableItem = {
  id: string;
  name: string;
  vendor: string | null;
  quantity: number;
  unitPrice: string;
  projectName: string;
};

export function InvoiceEditor({
  invoiceId,
  status,
  currency,
  lineItems,
  billableTime,
  billableItems,
  taxRate,
  discount,
  canManage,
}: {
  invoiceId: string;
  status: string;
  currency: string;
  lineItems: LineItem[];
  billableTime: BillableTime[];
  billableItems: BillableItem[];
  taxRate: string;
  discount: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [line, setLine] = useState({ description: "", quantity: "1", unitPrice: "" });
  const [adjust, setAdjust] = useState({ taxRate, discount });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locked = status === "PAID" || status === "VOID";

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function importSelected() {
    await run(async () => {
      await request(`/api/invoices/${invoiceId}/import`, {
        body: { timeEntryIds: selectedTime, selectionIds: selectedItems },
      });
      setSelectedTime([]);
      setSelectedItems([]);
      setImportOpen(false);
    });
  }

  async function addLine() {
    await run(async () => {
      await request(`/api/invoices/${invoiceId}/line-items`, {
        body: {
          description: line.description,
          quantity: Number(line.quantity) || 1,
          unitPrice: Number(line.unitPrice) || 0,
        },
      });
      setLine({ description: "", quantity: "1", unitPrice: "" });
      setAddOpen(false);
    });
  }

  const removeLine = (itemId: string) =>
    run(() => request(`/api/invoices/${invoiceId}/line-items/${itemId}`, { method: "DELETE" }));

  const saveAdjustments = () =>
    run(() =>
      request(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        body: { taxRate: Number(adjust.taxRate) || 0, discount: Number(adjust.discount) || 0 },
      })
    );

  const send = () =>
    run(() => request(`/api/invoices/${invoiceId}`, { method: "PATCH", body: { status: "SENT" } }));

  const voidInvoice = () => {
    if (!confirm("Void this invoice? It stays on record but can no longer be paid.")) return;
    return run(() => request(`/api/invoices/${invoiceId}`, { method: "PATCH", body: { status: "VOID" } }));
  };

  async function paymentLink() {
    await run(async () => {
      const { url } = await request<{ url: string }>(`/api/invoices/${invoiceId}/checkout`, {});
      if (url) window.open(url, "_blank", "noopener");
    });
  }

  return (
    <Card>
      <CardHeader
        title="Line items"
        description={locked ? "This invoice is locked." : "Pull in time and items, or write your own lines."}
        action={
          canManage && !locked ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Download className="h-3.5 w-3.5" /> Pull in work
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
              {status === "DRAFT" ? (
                <Button size="sm" onClick={send} disabled={busy || lineItems.length === 0}>
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              ) : (
                <Button size="sm" onClick={paymentLink} disabled={busy}>
                  Payment link
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={voidInvoice} disabled={busy}>
                <Ban className="h-3.5 w-3.5" /> Void
              </Button>
            </div>
          ) : undefined
        }
      />

      {lineItems.length === 0 ? (
        <CardBody>
          <p className="text-sm text-ink-400">Nothing on this invoice yet.</p>
        </CardBody>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Description</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Rate</Th>
              <Th className="text-right">Amount</Th>
              {canManage && !locked && <Th />}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id}>
                <Td>
                  {item.description}
                  <span className="ml-2 text-[11px] uppercase tracking-wide text-ink-300">
                    {item.kind.toLowerCase()}
                  </span>
                </Td>
                <Td className="text-right text-ink-500">{Number(item.quantity)}</Td>
                <Td className="text-right text-ink-500">{formatMoney(item.unitPrice, currency)}</Td>
                <Td className="text-right text-ink-800">{formatMoney(item.amount, currency)}</Td>
                {canManage && !locked && (
                  <Td className="w-10">
                    <button
                      type="button"
                      onClick={() => removeLine(item.id)}
                      className="rounded p-1 text-ink-300 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {canManage && !locked && (
        <CardBody className="border-t border-clay-100">
          <FormRow className="sm:grid-cols-[auto_auto_auto] sm:items-end">
            <div>
              <Label htmlFor="adj-discount">Discount</Label>
              <Input
                id="adj-discount"
                type="number"
                min="0"
                step="0.01"
                value={adjust.discount}
                onChange={(e) => setAdjust({ ...adjust, discount: e.target.value })}
                className="w-32"
              />
            </div>
            <div>
              <Label htmlFor="adj-tax" hint="%">Tax rate</Label>
              <Input
                id="adj-tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={adjust.taxRate}
                onChange={(e) => setAdjust({ ...adjust, taxRate: e.target.value })}
                className="w-32"
              />
            </div>
            <Button size="sm" variant="outline" onClick={saveAdjustments} disabled={busy}>
              Update totals
            </Button>
          </FormRow>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </CardBody>
      )}

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        size="lg"
        title="Pull in work"
        description="Unbilled billable hours and approved items for this client."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={importSelected}
              disabled={busy || (selectedTime.length === 0 && selectedItems.length === 0)}
            >
              Add {selectedTime.length + selectedItems.length} line
              {selectedTime.length + selectedItems.length === 1 ? "" : "s"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Unbilled time</h3>
            {billableTime.length === 0 ? (
              <p className="text-sm text-ink-400">No unbilled hours.</p>
            ) : (
              <ul className="space-y-1">
                {billableTime.map((entry) => (
                  <li key={entry.id}>
                    <label className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-clay-50">
                      <input
                        type="checkbox"
                        checked={selectedTime.includes(entry.id)}
                        onChange={() => toggle(selectedTime, setSelectedTime, entry.id)}
                        className="mt-0.5 h-4 w-4 rounded border-ink-300"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink-700">{entry.description}</span>
                        <span className="block text-xs text-ink-400">
                          {formatDate(entry.workDate)} · {entry.projectName} · {formatDuration(entry.minutes)}
                        </span>
                      </span>
                      <span className="text-sm text-ink-600">
                        {formatMoney((entry.minutes / 60) * Number(entry.hourlyRate), currency)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Approved items</h3>
            {billableItems.length === 0 ? (
              <p className="text-sm text-ink-400">No approved items waiting to be billed.</p>
            ) : (
              <ul className="space-y-1">
                {billableItems.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-clay-50">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggle(selectedItems, setSelectedItems, item.id)}
                        className="mt-0.5 h-4 w-4 rounded border-ink-300"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink-700">{item.name}</span>
                        <span className="block text-xs text-ink-400">
                          {[item.vendor, item.projectName].filter(Boolean).join(" · ")} · qty {item.quantity}
                        </span>
                      </span>
                      <span className="text-sm text-ink-600">
                        {formatMoney(item.quantity * Number(item.unitPrice), currency)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a line"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={addLine} disabled={busy || !line.description.trim()}>
              Add line
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="l-desc">Description</Label>
            <Input
              id="l-desc"
              value={line.description}
              onChange={(e) => setLine({ ...line, description: e.target.value })}
            />
          </div>
          <FormRow>
            <div>
              <Label htmlFor="l-qty">Quantity</Label>
              <Input
                id="l-qty"
                type="number"
                min="0"
                step="0.01"
                value={line.quantity}
                onChange={(e) => setLine({ ...line, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="l-price">Unit price</Label>
              <Input
                id="l-price"
                type="number"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => setLine({ ...line, unitPrice: e.target.value })}
              />
            </div>
          </FormRow>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </Card>
  );
}

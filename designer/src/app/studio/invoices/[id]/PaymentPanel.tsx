"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormRow, Input, Label, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatMoney } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export type PaymentRow = {
  id: string;
  amount: string;
  method: string;
  reference: string | null;
  paidAt: string;
  recordedBy: string | null;
};

const METHODS = ["CHECK", "ACH", "WIRE", "CASH", "STRIPE", "OTHER"];

export function PaymentPanel({
  invoiceId,
  payments,
  balance,
  currency,
  canRecord,
}: {
  invoiceId: string;
  payments: PaymentRow[];
  balance: number;
  currency: string;
  canRecord: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: balance.toFixed(2),
    method: "CHECK",
    reference: "",
    paidAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function record() {
    setBusy(true);
    setError(null);
    try {
      await request(`/api/invoices/${invoiceId}/payments`, {
        body: {
          amount: Number(form.amount),
          method: form.method,
          reference: form.reference || null,
          paidAt: form.paidAt,
        },
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record that payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Payments"
        description={`${formatMoney(balance, currency)} still due`}
        action={
          canRecord && balance > 0 ? (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Record payment</Button>
          ) : undefined
        }
      />
      <CardBody>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing received yet.</p>
        ) : (
          <ul className="divide-y divide-clay-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="block text-sm text-ink-700">
                    {payment.method.charAt(0) + payment.method.slice(1).toLowerCase()}
                    {payment.reference && <span className="text-ink-400"> · {payment.reference}</span>}
                  </span>
                  <span className="block text-xs text-ink-400">
                    {formatDate(payment.paidAt)}
                    {payment.recordedBy && ` · recorded by ${payment.recordedBy}`}
                  </span>
                </span>
                <span className="text-sm font-medium text-ink-800">{formatMoney(payment.amount, currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record a payment"
        description="For money received outside the portal."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={record} disabled={busy || !Number(form.amount)}>
              {busy ? "Recording…" : "Record"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <div>
              <Label htmlFor="p-amount">Amount</Label>
              <Input
                id="p-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-method">Method</Label>
              <Select
                id="p-method"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
                ))}
              </Select>
            </div>
          </FormRow>
          <FormRow>
            <div>
              <Label htmlFor="p-date">Received on</Label>
              <Input
                id="p-date"
                type="date"
                value={form.paidAt}
                onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="p-ref" hint="check no., trace id">Reference</Label>
              <Input
                id="p-ref"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>
          </FormRow>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Modal>
    </Card>
  );
}

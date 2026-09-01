"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export function PayButton({
  invoiceId,
  balance,
  currency,
}: {
  invoiceId: string;
  balance: number;
  currency: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await request<{ url: string }>(`/api/invoices/${invoiceId}/checkout`, {});
      if (url) window.location.href = url;
      else throw new Error("Stripe didn't return a checkout link.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button onClick={pay} disabled={busy} className="w-full">
        <CreditCard className="h-4 w-4" />
        {busy ? "Opening Stripe…" : `Pay ${formatMoney(balance, currency)}`}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

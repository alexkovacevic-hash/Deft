"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export type PortalSelection = {
  id: string;
  name: string;
  vendor: string | null;
  description: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  leadTimeWeeks: number | null;
  status: string;
  clientNote: string | null;
};

export function SelectionCard({
  selection,
  currency,
  canApprove,
}: {
  selection: PortalSelection;
  currency: string;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const awaiting = selection.status === "PROPOSED";

  async function decide(decision: "APPROVED" | "REJECTED") {
    setBusy(true);
    setError(null);
    try {
      await request(`/api/portal/selections/${selection.id}`, {
        body: { decision, note: note || null },
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your decision.");
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-clay-200 bg-white">
      {selection.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={selection.imageUrl} alt={selection.name} className="h-48 w-full object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink-800">{selection.name}</h3>
            {selection.vendor && <p className="text-xs text-ink-400">{selection.vendor}</p>}
          </div>
          <StatusBadge status={selection.status} kind="selection" />
        </div>

        {selection.description && <p className="mt-2 text-sm text-ink-500">{selection.description}</p>}

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-ink-900">
            {formatMoney(selection.quantity * Number(selection.unitPrice), currency)}
          </span>
          <span className="text-xs text-ink-400">
            {selection.quantity} × {formatMoney(selection.unitPrice, currency)}
          </span>
          {selection.leadTimeWeeks != null && (
            <span className="text-xs text-ink-400">{selection.leadTimeWeeks} week lead time</span>
          )}
        </div>

        {selection.productUrl && (
          <a
            href={selection.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-clay-700 hover:underline"
          >
            View the product <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {selection.clientNote && (
          <p className="mt-3 rounded bg-clay-50 px-2 py-1.5 text-xs text-clay-800">
            Your note: {selection.clientNote}
          </p>
        )}

        {awaiting && canApprove && (
          <div className="mt-4 space-y-2 border-t border-clay-100 pt-3">
            {showNote && (
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you'd like your designer to know…"
                className="text-sm"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => decide("APPROVED")} disabled={busy}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide("REJECTED")} disabled={busy}>
                <X className="h-3.5 w-3.5" /> Not this one
              </Button>
              {!showNote && (
                <Button size="sm" variant="ghost" onClick={() => setShowNote(true)}>
                  Add a note
                </Button>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}

        {awaiting && !canApprove && (
          <p className="mt-3 border-t border-clay-100 pt-3 text-xs text-ink-400">
            Waiting on approval from whoever signs off for this project.
          </p>
        )}
      </div>
    </div>
  );
}

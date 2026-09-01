"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Label } from "@/components/ui/Field";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDuration, formatMoney, parseDurationToMinutes } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export type TimeRow = {
  id: string;
  workDate: string;
  minutes: number;
  description: string;
  hourlyRate: string;
  billable: boolean;
  invoiced: boolean;
  userName: string;
  ownedByMe: boolean;
};

export function TimePanel({
  projectId,
  entries,
  currency,
  canLog,
}: {
  projectId: string;
  entries: TimeRow[];
  currency: string;
  canLog: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    duration: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function log() {
    const minutes = parseDurationToMinutes(form.duration);
    if (!minutes || minutes <= 0) {
      setError("Enter time as 1.5, 1:30 or 90m.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await request("/api/time-entries", {
        body: {
          projectId,
          workDate: form.workDate,
          minutes,
          description: form.description,
        },
      });
      setForm({ ...form, duration: "", description: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log that time.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this time entry?")) return;
    try {
      await request(`/api/time-entries/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete that entry.");
    }
  }

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const unbilled = entries.filter((e) => e.billable && !e.invoiced);
  const unbilledValue = unbilled.reduce((sum, e) => sum + (e.minutes / 60) * Number(e.hourlyRate), 0);

  return (
    <Card>
      <CardHeader
        title="Time"
        description={`${formatDuration(totalMinutes)} logged · ${formatMoney(unbilledValue, currency)} unbilled`}
      />
      <CardBody className="space-y-4">
        {canLog && (
          <div className="rounded-lg border border-clay-100 bg-clay-50/60 p-3">
            <FormRow className="sm:grid-cols-[auto_auto_1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="t-date">Date</Label>
                <Input
                  id="t-date"
                  type="date"
                  value={form.workDate}
                  onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="t-dur" hint="1.5 · 1:30 · 90m">Time</Label>
                <Input
                  id="t-dur"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-24"
                />
              </div>
              <div>
                <Label htmlFor="t-desc">What you did</Label>
                <Input
                  id="t-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Sourcing dining chairs"
                />
              </div>
              <Button size="sm" onClick={log} disabled={busy || !form.description.trim()}>
                <Clock className="h-3.5 w-3.5" /> Log
              </Button>
            </FormRow>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-ink-400">No time logged against this project.</p>
        ) : (
          <ul className="divide-y divide-clay-100">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2">
                <span className="w-24 shrink-0 text-xs text-ink-400">{formatDate(entry.workDate)}</span>
                <span className="w-16 shrink-0 text-sm text-ink-700">{formatDuration(entry.minutes)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-700">{entry.description}</span>
                  <span className="block text-xs text-ink-400">{entry.userName}</span>
                </span>
                <span className="shrink-0 text-sm text-ink-600">
                  {formatMoney((entry.minutes / 60) * Number(entry.hourlyRate), currency)}
                </span>
                {!entry.billable && <Badge tone="neutral">Non-billable</Badge>}
                {entry.invoiced && <Badge tone="green">Invoiced</Badge>}
                {canLog && entry.ownedByMe && !entry.invoiced && (
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    className="rounded p-1 text-ink-300 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormRow, Input, Label, Select } from "@/components/ui/Field";
import { parseDurationToMinutes } from "@/lib/utils";
import { request } from "@/lib/fetcher";

export function LogTimeForm({ projects }: { projects: { id: string; label: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? "",
    workDate: new Date().toISOString().slice(0, 10),
    duration: "",
    description: "",
    billable: true,
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
          projectId: form.projectId,
          workDate: form.workDate,
          minutes,
          description: form.description,
          billable: form.billable,
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

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader title="Log time" />
        <CardBody>
          <p className="text-sm text-ink-400">No open projects to log against yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Log time" description="Hours land on the project and become invoice lines later." />
      <CardBody>
        <FormRow className="lg:grid-cols-[2fr_auto_auto_3fr_auto] lg:items-end">
          <div>
            <Label htmlFor="lt-project">Project</Label>
            <Select
              id="lt-project"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="lt-date">Date</Label>
            <Input
              id="lt-date"
              type="date"
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lt-dur" hint="1.5 · 1:30 · 90m">Time</Label>
            <Input
              id="lt-dur"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="w-24"
            />
          </div>
          <div>
            <Label htmlFor="lt-desc">What you did</Label>
            <Input
              id="lt-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button size="sm" onClick={log} disabled={busy || !form.description.trim()}>
            <Clock className="h-3.5 w-3.5" /> Log
          </Button>
        </FormRow>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={form.billable}
            onChange={(e) => setForm({ ...form, billable: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300"
          />
          Billable
        </label>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </CardBody>
    </Card>
  );
}

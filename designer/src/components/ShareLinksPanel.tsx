"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, EyeOff, Link2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { request } from "@/lib/fetcher";

export type SharedLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  category: string;
  visibleToClient: boolean;
};

const CATEGORIES = [
  { value: "INSPIRATION", label: "Inspiration" },
  { value: "VENDOR", label: "Vendor" },
  { value: "MOODBOARD", label: "Moodboard" },
  { value: "DOCUMENT", label: "Document" },
  { value: "OTHER", label: "Other" },
];

/** Websites the studio shares into the client portal. */
export function ShareLinksPanel({
  links,
  projectId,
  clientId,
  editable,
  title = "Shared websites",
  description = "Links your client can open from their portal",
}: {
  links: SharedLink[];
  projectId?: string;
  clientId?: string;
  editable: boolean;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    url: "",
    title: "",
    description: "",
    imageUrl: "",
    siteName: "",
    category: "INSPIRATION",
    visibleToClient: true,
  });

  /** Pull Open Graph data so the designer only pastes a URL. */
  async function lookup() {
    if (!form.url.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const { preview } = await request<{
        preview: { title: string | null; description: string | null; imageUrl: string | null; siteName: string | null } | null;
      }>("/api/resources/preview", { body: { url: form.url.trim() } });

      if (preview) {
        setForm((prev) => ({
          ...prev,
          title: prev.title || preview.title || "",
          description: prev.description || preview.description || "",
          imageUrl: prev.imageUrl || preview.imageUrl || "",
          siteName: prev.siteName || preview.siteName || "",
        }));
      } else {
        setError("Couldn't read that page — fill in the details yourself.");
      }
    } catch {
      setError("Couldn't read that page — fill in the details yourself.");
    } finally {
      setFetching(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await request("/api/resources", {
        body: {
          projectId: projectId ?? null,
          clientId: projectId ? null : clientId ?? null,
          title: form.title.trim() || form.url,
          url: form.url.trim(),
          description: form.description || null,
          imageUrl: form.imageUrl || null,
          siteName: form.siteName || null,
          category: form.category,
          visibleToClient: form.visibleToClient,
        },
      });
      setOpen(false);
      setForm({
        url: "",
        title: "",
        description: "",
        imageUrl: "",
        siteName: "",
        category: "INSPIRATION",
        visibleToClient: true,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not share that link.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(link: SharedLink) {
    await request(`/api/resources/${link.id}`, {
      method: "PATCH",
      body: { visibleToClient: !link.visibleToClient },
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this link from the portal?")) return;
    await request(`/api/resources/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          editable ? (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Link2 className="h-3.5 w-3.5" /> Share a link
            </Button>
          ) : undefined
        }
      />
      <CardBody>
        {links.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing shared yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <div key={link.id} className="flex gap-3 rounded-lg border border-clay-100 p-3">
                {link.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={link.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 text-sm font-medium text-ink-800 hover:underline"
                    >
                      {link.title}
                      <ExternalLink className="ml-1 inline h-3 w-3 text-ink-300" />
                    </a>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => remove(link.id)}
                        className="rounded p-0.5 text-ink-300 hover:text-red-600"
                        aria-label="Remove link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {link.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-400">{link.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="clay">{CATEGORIES.find((c) => c.value === link.category)?.label ?? link.category}</Badge>
                    {link.siteName && <span className="text-[11px] text-ink-300">{link.siteName}</span>}
                    {editable && !link.visibleToClient && (
                      <button type="button" onClick={() => toggleVisibility(link)}>
                        <Badge tone="amber">
                          <EyeOff className="mr-1 inline h-3 w-3" /> Hidden
                        </Badge>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Share a website"
        description="Paste a URL and we'll pull the title, blurb and image."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy || !form.url.trim()}>
              {busy ? "Sharing…" : "Share"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="link-url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="link-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                onBlur={lookup}
                placeholder="https://…"
              />
              <Button type="button" size="sm" variant="outline" onClick={lookup} disabled={fetching}>
                <Sparkles className="h-3.5 w-3.5" />
                {fetching ? "Reading…" : "Fetch"}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="link-title">Title</Label>
            <Input
              id="link-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="link-desc">What should the client know?</Label>
            <Textarea
              id="link-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="link-cat">Category</Label>
            <Select
              id="link-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.visibleToClient}
              onChange={(e) => setForm({ ...form, visibleToClient: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300"
            />
            Visible in the client portal
          </label>
          {error && <p className="text-xs text-amber-700">{error}</p>}
        </div>
      </Modal>
    </Card>
  );
}

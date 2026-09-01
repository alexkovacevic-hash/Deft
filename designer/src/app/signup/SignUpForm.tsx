"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { request } from "@/lib/fetcher";

export function SignUpForm() {
  const [form, setForm] = useState({ studioName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await request("/api/auth/signup", { body: form });
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      window.location.href = "/studio";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="studioName">Studio name</Label>
        <Input id="studioName" required value={form.studioName} onChange={set("studioName")} />
      </div>
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" required value={form.name} onChange={set("name")} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
      </div>
      <div>
        <Label htmlFor="password" hint="at least 8 characters">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.password}
          onChange={set("password")}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating…" : "Create studio"}
      </Button>
    </form>
  );
}

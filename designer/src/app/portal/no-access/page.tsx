import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PortalNoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-clay-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-2xl text-ink-900">Nothing shared with you yet</h1>
        <p className="mt-2 text-sm text-ink-500">
          Your designer hasn&apos;t connected this email to a project. Once they do, everything they share will
          appear here.
        </p>
        <Link href="/api/auth/signout" className="mt-6 inline-block">
          <Button variant="outline" size="sm">Sign out</Button>
        </Link>
      </div>
    </main>
  );
}

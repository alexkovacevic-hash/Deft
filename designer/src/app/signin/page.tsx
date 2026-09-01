import Link from "next/link";
import { SignInForm } from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-clay-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="display block text-center text-xl text-ink-900">
          Deft Designer
        </Link>
        <h1 className="mt-6 text-center text-sm text-ink-500">Sign in to your studio or client portal</h1>
        <div className="mt-6 rounded-xl border border-clay-200 bg-white p-6 shadow-sm">
          <SignInForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          New studio?{" "}
          <Link href="/signup" className="font-medium text-clay-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

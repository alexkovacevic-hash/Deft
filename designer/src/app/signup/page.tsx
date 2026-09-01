import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-clay-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="display block text-center text-xl text-ink-900">
          Deft Designer
        </Link>
        <h1 className="mt-6 text-center text-sm text-ink-500">
          Create your studio. You&apos;ll be its owner, with every permission.
        </h1>
        <div className="mt-6 rounded-xl border border-clay-200 bg-white p-6 shadow-sm">
          <SignUpForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-clay-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

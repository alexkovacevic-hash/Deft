"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageIcon, Mail, Phone, Lock, Shield } from "lucide-react";

export default function SignInPage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // In production, this would call signIn("credentials", {...})
    // For now, simulate the flow
    try {
      if (!show2FA) {
        // First step: validate credentials, check if 2FA is needed
        setShow2FA(true);
        setLoading(false);
        return;
      }
      // Second step: validate 2FA code
      // signIn("credentials", { login, password, totp: totpCode })
      window.location.href = "/gallery";
    } catch {
      setError("Invalid credentials or 2FA code.");
    }
    setLoading(false);
  };

  const handleOAuthSignIn = (provider: string) => {
    // In production: signIn(provider, { callbackUrl: "/gallery" })
    window.location.href = `/api/auth/signin?provider=${provider}`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 mb-4">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access your gallery and orders.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignIn("google")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthSignIn("microsoft-entra-id")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Continue with Microsoft
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">
              or sign in with
            </span>
          </div>
        </div>

        {/* Login Method Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginMethod("email")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              loginMethod === "email"
                ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Mail className="h-4 w-4" /> Email
          </button>
          <button
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              loginMethod === "phone"
                ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Phone className="h-4 w-4" /> Phone
          </button>
        </div>

        {/* Credential Form */}
        <form onSubmit={handleCredentialSignIn} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            id="login"
            label={loginMethod === "email" ? "Email Address" : "Phone Number"}
            type={loginMethod === "email" ? "email" : "tel"}
            placeholder={
              loginMethod === "email"
                ? "you@example.com"
                : "+1 (555) 123-4567"
            }
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {show2FA && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-800">
                  Two-Factor Authentication
                </span>
              </div>
              <Input
                id="totp"
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </span>
            ) : show2FA ? (
              <>
                <Lock className="h-4 w-4 mr-2" /> Verify & Sign In
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-teal-600 hover:text-teal-700"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

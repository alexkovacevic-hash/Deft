"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageIcon, Mail, Phone, Shield, Check } from "lucide-react";

export default function SignUpPage() {
  const [step, setStep] = useState<"details" | "2fa-setup" | "done">("details");
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    // In production: API call to create account
    setTimeout(() => {
      setStep("2fa-setup");
      setLoading(false);
    }, 1000);
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In production: verify TOTP and enable 2FA
    setTimeout(() => {
      setStep("done");
      setLoading(false);
    }, 1000);
  };

  if (step === "done") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-6">
            <Check className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Account Created!
          </h1>
          <p className="mt-3 text-gray-500">
            Your account is set up with two-factor authentication. You&apos;re
            ready to start creating beautiful photo products.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/gallery">
              <Button variant="primary" size="lg" className="w-full">
                Go to My Gallery
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline" size="lg" className="w-full">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 mb-4">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "details" ? "Create Your Account" : "Set Up 2FA"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === "details"
              ? "Join to start printing your favorite photos."
              : "Secure your account with two-factor authentication."}
          </p>
        </div>

        {step === "details" && (
          <>
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>
              <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Sign up with Microsoft
              </button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-400">
                  or register with
                </span>
              </div>
            </div>

            {/* Signup Method Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setSignupMethod("email")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  signupMethod === "email"
                    ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                onClick={() => setSignupMethod("phone")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  signupMethod === "phone"
                    ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Phone className="h-4 w-4" /> Phone
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Input
                id="name"
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                id="login"
                label={signupMethod === "email" ? "Email Address" : "Phone Number"}
                type={signupMethod === "email" ? "email" : "tel"}
                placeholder={
                  signupMethod === "email" ? "you@example.com" : "+1 (555) 123-4567"
                }
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />

              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </>
        )}

        {step === "2fa-setup" && (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="rounded-2xl bg-teal-50 border border-teal-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-teal-600" />
                <span className="font-semibold text-teal-800">
                  Two-Factor Authentication Required
                </span>
              </div>
              <p className="text-sm text-teal-700 mb-4">
                Scan the QR code below with your authenticator app (Google
                Authenticator, Authy, etc.) then enter the 6-digit code.
              </p>

              {/* QR Code Placeholder */}
              <div className="mx-auto w-48 h-48 rounded-xl bg-white border border-teal-200 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-teal-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">QR Code</p>
                  <p className="text-xs text-gray-400">
                    (Generated at runtime)
                  </p>
                </div>
              </div>

              <p className="text-xs text-teal-600 text-center">
                Manual setup key: XXXX-XXXX-XXXX-XXXX
              </p>
            </div>

            <Input
              id="totp-verify"
              label="Enter Verification Code"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Enable 2FA & Complete Setup"}
            </Button>
          </form>
        )}

        {step === "details" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-teal-600 hover:text-teal-700"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  Info,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth/auth-context";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Invalid email address");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      if (msg.includes("user-not-found")) {
        // Security best practice: don't reveal whether user exists
        setIsSubmitted(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-slate-500">
              Receive a secure password reset link to your email address
            </p>
          </div>

          {!isConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1 break-words">
                <span className="font-semibold block">Firebase Environment Setup Required</span>
                <p className="text-amber-700 break-words">
                  Client environment variables (`NEXT_PUBLIC_FIREBASE_*`) have not been populated in your local `.env.local`. See docs/FIREBASE_SETUP.md for configuration instructions.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-3"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Reset Error</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Password Recovery</CardTitle>
              <CardDescription>
                Enter the email associated with your CivicFlow account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Reset Link Dispatched
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      If an account exists for <span className="font-medium text-slate-700">{email}</span>, you will receive an email with instructions to reset your password.
                    </p>
                  </div>
                  <Link href="/login" className="inline-block pt-2">
                    <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Registered email address"
                    type="email"
                    required
                    placeholder="citizen@example.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    autoComplete="email"
                    helperText="We will send a password reset link to this address."
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isLoading}
                    rightIcon={<Send className="h-4 w-4" />}
                  >
                    Send Reset Link
                  </Button>
                </form>
              )}
            </CardContent>
            {!isSubmitted && (
              <CardFooter className="justify-center border-t border-slate-100 pt-4 text-xs text-slate-500">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

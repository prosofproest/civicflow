"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/lib/auth/auth-context";
import { loginSchema } from "@/lib/validation/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const { loginWithEmail, loginWithGoogle, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const routeUserByRole = (role: string) => {
    if (redirectPath && redirectPath.startsWith("/")) {
      router.push(redirectPath);
      return;
    }
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "officer") {
      router.push("/officer");
    } else {
      router.push("/citizen");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Invalid inputs");
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      routeUserByRole(user.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setErrorMessage("Invalid email or password. Please verify and try again.");
      } else if (msg.includes("too-many-requests")) {
        setErrorMessage("Access to this account has been temporarily disabled due to many failed attempts. Try again later.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      routeUserByRole(user.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      if (msg.includes("popup-closed-by-user")) {
        setErrorMessage("Sign-in popup was closed before completing.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="w-full max-w-md min-w-0 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to CivicFlow
          </h1>
          <p className="text-sm text-slate-500">
            Access the municipal action and civic resolution portal
          </p>
        </div>

        {!isConfigured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0 flex-1 break-words">
              <span className="font-semibold block">Firebase Setup Required</span>
              <p className="text-amber-700 break-words">
                Client environment variables (`NEXT_PUBLIC_FIREBASE_*`) have not been populated in your local `.env.local`. See docs/FIREBASE_SETUP.md.
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
                <span className="font-semibold block">Authentication Error</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Account Login</CardTitle>
              <CardDescription>
                Sign in with your registered email or Google identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center text-slate-700 border-slate-300 hover:bg-slate-50"
                isLoading={isGoogleLoading}
                onClick={handleGoogleLogin}
                leftIcon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                }
              >
                Sign In with Google
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-400">
                  Or continue with email
                </span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  required
                  placeholder="citizen@example.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center border-t border-slate-100 pt-4 text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 ml-1"
              >
                Register as Citizen
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  export default function LoginPage() {
    return (
      <PageShell>
        <Suspense
          fallback={
            <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center p-8">
              <LoadingState title="Loading sign-in portal..." />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </PageShell>
    );
  }

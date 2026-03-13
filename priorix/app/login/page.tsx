"use client";

import Link from "next/link";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate credentials first to get the actual error message
      const validateRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await validateRes.json();
      if (!validateRes.ok) {
        setError(data.message);
        return;
      }

      // Credentials are valid, proceed with NextAuth sign-in
      const res = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        setError("Sign-in failed. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-mint selection:text-foreground relative">
      <Link
        href="/"
        className="absolute top-6 left-6 font-editorial italic text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity"
      >
        Priorix
      </Link>

      <div className="w-full max-w-md bento-card relative overflow-hidden bg-card">
        {/* Decorative corner accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-citrus rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-5xl tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground font-medium">
              Ready to crush your study session?
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-2xl text-sm font-bold shadow-bento-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-bold uppercase tracking-wider pl-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:-translate-y-1 focus:shadow-bento transition-all placeholder:text-muted-foreground/50"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1">
                <label
                  htmlFor="password"
                  className="text-sm font-bold uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground underline decoration-2 decoration-mint underline-offset-4 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 pr-12 text-foreground focus:outline-none focus:-translate-y-1 focus:shadow-bento transition-all placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center pl-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 border-2 border-border rounded text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm font-bold cursor-pointer"
              >
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-0.5 bg-border/10"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Or continue with
            </span>
            <div className="flex-1 h-0.5 bg-border/10"></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full btn-base bg-background hover:-translate-y-1 hover:shadow-bento py-3"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-bold">Google</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-sm font-medium text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-foreground underline decoration-2 decoration-lilac underline-offset-4 hover:bg-lilac transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

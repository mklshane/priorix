"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      // Auto-login after signup
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError(
          "Account created but auto-login failed. Please log in manually.",
        );
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-blush selection:text-foreground">
      <div className="w-full max-w-md bento-card relative overflow-hidden bg-card">
        {/* Decorative corner accent */}
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blush rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-mint border-2 border-border mb-2 shadow-bento">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-5xl tracking-tight">Join Priorix</h1>
            <p className="text-muted-foreground font-medium">
              Start building your ultimate study ledger.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-2xl text-sm font-bold shadow-bento-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-bold uppercase tracking-wider pl-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:-translate-y-1 focus:shadow-bento transition-all placeholder:text-muted-foreground/50"
                placeholder="Rafael Davis"
              />
            </div>

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
                placeholder="rafael@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-wider pl-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:-translate-y-1 focus:shadow-bento transition-all placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-[10px] font-bold uppercase tracking-wider pl-1"
                >
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:-translate-y-1 focus:shadow-bento transition-all placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-pastel-mint py-4 mt-2 text-lg"
            >
              {loading ? "Setting up..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-0.5 bg-border/10"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Or continue with
            </span>
            <div className="flex-1 h-0.5 bg-border/10"></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={() => signIn("google", { redirectTo: "/dashboard" })}
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-foreground underline decoration-2 decoration-citrus underline-offset-4 hover:bg-citrus transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import React, { useState } from "react";

import { KeyRound } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-lilac selection:text-foreground relative">
      <Link
        href="/"
        className="absolute top-6 left-6 font-editorial italic text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity"
      >
        Priorix
      </Link>

      <div className="w-full max-w-md bento-card relative overflow-hidden bg-card">
        {/* Decorative corner accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-lilac rounded-full blur-2xl opacity-50 pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-lilac border-2 border-border mb-2 shadow-bento">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-5xl tracking-tight">Forgot Password</h1>
            <p className="text-muted-foreground font-medium">
              Enter your email and we'll send a reset link
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-2xl text-sm font-bold shadow-bento-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-400/20 border-2 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-bold shadow-bento-sm">
              {success}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 relative z-10">
          <p className="text-sm font-medium text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-foreground hover:text-mint font-bold underline decoration-2 decoration-mint/30 underline-offset-4 transition-all"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

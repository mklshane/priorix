"use client";
import Link from "next/link";
import React, { useState } from "react";

const ForgotPassword = () => {
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
    <div className="min-h-screen bg-primary-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center py-5">
        <div className="text-center mb-8">
          <p className="font-lora italic text-4xl tracking-wide mb-3">
            Forgot Password
          </p>
          <div className="w-24 h-1 bg-green rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-md text-lg">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="w-full bg-green/80 noise rounded-[10px] border-2 border-primary p-8 shadow-lg">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <div className="flex flex-col">
              <label htmlFor="email" className="font-sora text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-2xl border-2 bg-amber-50 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple text-foreground py-3 px-4 rounded-2xl hover:bg-purple/80 focus:outline-none focus:ring-2 focus:ring-course-blue transition shadow-md hover:shadow-lg btn-base btn-hover btn-active disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-bold transition hover:text-purple">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

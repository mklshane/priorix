"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  if (!token) {
    return (
      <div className="min-h-screen bg-primary-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center">
          <p className="font-lora italic text-2xl mb-4">Invalid Reset Link</p>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="font-bold text-purple hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center py-5">
        <div className="text-center mb-8">
          <p className="font-lora italic text-4xl tracking-wide mb-3">
            Reset Password
          </p>
          <div className="w-24 h-1 bg-green rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-md text-lg">
            Enter your new password
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
              {success}{" "}
              <Link href="/login" className="font-bold underline">
                Log in now
              </Link>
            </div>
          )}
          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              <div className="flex flex-col">
                <label htmlFor="password" className="font-sora text-foreground mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-4 py-3 rounded-2xl border-2 bg-amber-50 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="confirmPassword" className="font-sora text-foreground mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-4 py-3 rounded-2xl border-2 bg-amber-50 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple text-foreground py-3 px-4 rounded-2xl hover:bg-purple/80 focus:outline-none focus:ring-2 focus:ring-course-blue transition shadow-md hover:shadow-lg btn-base btn-hover btn-active disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ResetPassword = () => {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPassword;

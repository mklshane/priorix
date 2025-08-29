"use client";
import React, { useState } from "react";
import Link from "next/link";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, email, password, confirmPassword, agreeToTerms });
  };

  return (
    <div className="min-h-screen bg-primary-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <p className="font-lora italic text-4xl tracking-wide mb-3">
            Create Account
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-course-pink via-course-blue to-course-yellow rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-md text-lg">
            Join us to start your productivity journey
          </p>
        </div>

        {/* Sign Up Box - Yellow Container */}
        <div className="w-full bg-yellow-200 noise rounded-[10px] border-2 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            {/* Name Input */}
            <div className="flex flex-col">
              <label htmlFor="name" className="font-sora text-foreground mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-3 rounded-2xl border-2 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col">
              <label htmlFor="email" className="font-sora text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-2xl border-2 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="font-sora text-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-2xl border-2 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col">
              <label
                htmlFor="confirmPassword"
                className="font-sora text-foreground mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-4 py-3 rounded-2xl border-2 border-black focus:ring-2 focus:ring-input focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center">
              <input
                id="agree-to-terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label
                htmlFor="agree-to-terms"
                className="ml-2 block text-sm text-foreground"
              >
                I agree to the Terms and Conditions
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r bg-course-pink text-foreground py-3 px-4 rounded-2xl hover:bg-course-yellow focus:outline-none focus:ring-2 focus:ring-course-blue transition shadow-md hover:shadow-lg"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Login Prompt */}
        <div className="mt-6 text-center">
          <p className="text-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-course-blue hover:text-course-pink transition"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

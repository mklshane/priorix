"use client";
import Link from "next/link";
import React, { useState } from "react";

const LoginBox = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen bg-primary-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <p className="font-lora italic text-4xl tracking-wide mb-3">
            Welcome Back
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-course-pink via-course-blue to-course-yellow rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-md text-lg">
            Sign in to continue your productivity journey
          </p>
        </div>

        {/* Login Box */}
        <div className="w-full bg-course-blue noise rounded-[10px] border-2 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
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

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-course-blue focus:ring-course-blue border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-foreground"
                >
                  Remember me
                </label>
              </div>

              <a
                href="#"
                className="text-sm text-course-blue hover:text-course-pink transition"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r bg-course-pink text-foreground py-3 px-4 rounded-2xl hover:bg-course-yellow focus:outline-none focus:ring-2 focus:ring-course-blue transition shadow-md hover:shadow-lg"
            >
              Sign in
            </button>
          </form>
        </div>

        {/* Sign Up Prompt */}
        <div className="mt-6 text-center">
          <p className="text-foreground">
            Don't have an account?{" "}
            <Link href={"/signup"}>
              <button className="font-bold text-course-blue hover:text-course-pink transition ">
                Sign up
              </button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginBox;

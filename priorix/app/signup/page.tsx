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

  const handleGoogleLogin = () => {
    console.log("Google signup clicked");
    // Add Google OAuth logic here
  };

  const handleFacebookLogin = () => {
    console.log("Facebook signup clicked");
    // Add Facebook OAuth logic here
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
        <div className="w-full bg-course-khaki noise rounded-[10px] border-2 p-8 shadow-lg">
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
              className="w-full bg-gradient-to-r bg-course-blue text-foreground py-3 px-4 rounded-2xl hover:bg-course-pink focus:outline-none focus:ring-2 focus:ring-course-blue transition shadow-md hover:shadow-lg"
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-foreground">
              Or sign up with
            </span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-black rounded-2xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-input transition shadow-sm hover:shadow-md"
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
              <span className="text-gray-700 font-medium">Google</span>
            </button>

            {/* Facebook Login Button */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-black rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-input transition shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-white font-medium">Facebook</span>
            </button>
          </div>
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

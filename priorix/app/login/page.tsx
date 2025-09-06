"use client";
import Link from "next/link";
import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const LoginBox = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  const { data } = useSession();
  const session = data;

  //console.log("Session: ", session)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false, // so we can handle errors manually
    });

    if (res?.error) {
      alert(res.error);
    } else {
      router.push("/dashboard");
    }
  };


  return (
    <div className="min-h-screen bg-primary-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center py-5">
        <div className="text-center mb-8">
          <p className="font-lora italic text-4xl tracking-wide mb-3">
            Welcome Back
          </p>
          <div className="w-24 h-1 bg-green rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-md text-lg">
            Sign in to continue your productivity journey
          </p>
        </div>

        {/* Login Box */}
        <div className="w-full bg-green/80 noise rounded-[10px] border-2 border-primary p-8 shadow-lg">
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
                className="text-sm text-foreground hover:text-course-yellow transition"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r bg-purple text-foreground py-3 px-4 rounded-2xl hover:bg-purple/80 focus:outline-none focus:ring-2 focus:ring-course-blue transition shadow-md hover:shadow-lg btn-base btn-hover btn-active"
            >
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-primary"></div>
            <span className="px-4 text-sm text-foreground">
              Or continue with
            </span>
            <div className="flex-1 border-t border-primary"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex-1 flex items-center justify-center px-4 py-3 rounded-2xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-input transition shadow-sm hover:shadow-md btn-base btn-hover btn-active"
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
          </div>
        </div>

        {/* Sign Up Prompt */}
        <div className="mt-6 text-center">
          <p className="text-foreground">
            Don't have an account?{" "}
            <Link href={"/signup"}>
              <button className="font-bold transition hover:text-purple">
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

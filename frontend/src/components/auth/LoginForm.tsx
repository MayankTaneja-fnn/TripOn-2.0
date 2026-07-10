"use client";

import { login } from "@/app/actions/auth";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      id="login-submit"
      disabled={pending}
      className="w-full py-3 rounded-lg bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue-hover transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}
export default function LoginForm() {
  return (
    <div className="glass-card p-8 w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
        <p className="text-sm text-text-secondary">
          Sign in to continue your journey
        </p>
      </div>

      {/* Form */}
      <form action={login} className="space-y-4">
        {/* Email */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Mail className="w-4 h-4" />
          </span>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            id="login-email"
            className="w-full glass-input px-4 py-3 pl-12 text-sm rounded-lg"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Lock className="w-4 h-4" />
          </span>
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            id="login-password"
            className="w-full glass-input px-4 py-3 pl-12 text-sm rounded-lg"
          />
        </div>

        <SubmitButton />
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-text-muted text-sm">or</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all cursor-pointer flex justify-center items-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      {/* Footer Link */}
      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}

import { signIn } from "@/lib/auth";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

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
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", formData);
        }}
        className="space-y-4"
      >
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

        {/* Sign In Button */}
        <button
          type="submit"
          id="login-submit"
          className="w-full py-3 rounded-lg bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue-hover transition-all cursor-pointer"
        >
          Sign In
        </button>
      </form>

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

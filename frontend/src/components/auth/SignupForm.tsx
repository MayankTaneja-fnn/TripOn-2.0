"use client";

import { signup } from "@/app/actions/auth";
import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";

export default function SignupForm() {
  return (
    <div className="glass-card p-8 w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">Join TripOn</h2>
        <p className="text-sm text-text-secondary">
          Create your account and start exploring
        </p>
      </div>

      {/* Form */}
      <form
        action={async (formData) => {
          await signup(formData);
        }}
        className="space-y-4"
      >
        {/* Username */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <User className="w-4 h-4" />
          </span>
          <input
            name="username"
            placeholder="Username"
            required
            id="signup-username"
            className="w-full glass-input px-4 py-3 pl-12 text-sm rounded-lg"
          />
        </div>

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
            id="signup-email"
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
            id="signup-password"
            className="w-full glass-input px-4 py-3 pl-12 text-sm rounded-lg"
          />
        </div>

        {/* Create Account Button */}
        <button
          type="submit"
          id="signup-submit"
          className="w-full py-3 rounded-lg bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue-hover transition-all cursor-pointer"
        >
          Create Account
        </button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}

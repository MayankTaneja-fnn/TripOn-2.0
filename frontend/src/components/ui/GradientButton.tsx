"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

type ButtonVariant = "primary" | "outline" | "ghost";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function GradientButton({
  children,
  variant = "primary",
  loading = false,
  icon,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: GradientButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all duration-250 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white px-6 py-3 hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-[0.98]",
    outline:
      "border border-indigo-500/30 text-indigo-300 px-6 py-3 hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:text-white active:scale-[0.98]",
    ghost:
      "text-slate-300 px-4 py-2 hover:text-white hover:bg-white/5 active:scale-[0.98]",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      type={props.type || "button"}
      onClick={props.onClick}
      {...(props as any)}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}

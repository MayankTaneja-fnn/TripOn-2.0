"use client";

import { InputHTMLAttributes, ReactNode } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

export default function GlassInput({
  icon,
  error,
  className = "",
  ...props
}: GlassInputProps) {
  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full glass-input px-4 py-3 text-sm
            ${icon ? "pl-12" : ""}
            ${error ? "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 pl-1">{error}</p>
      )}
    </div>
  );
}

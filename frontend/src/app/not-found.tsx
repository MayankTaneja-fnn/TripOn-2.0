"use client";

import { motion } from "framer-motion";
import { Compass, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-12">
      {/* Background Ambient Orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--accent-blue)]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#1e40af]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-card p-10 md:p-16 relative overflow-hidden"
        >
          {/* Decorative Top Gradient Line for Error state */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-70" />

          {/* Glitchy/Lost Icon Container */}
          <div className="flex justify-center mb-8 relative">
            <motion.div 
              initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-[var(--accent-blue)]/20 blur-xl rounded-full animate-pulse-glow" />
              <div className="relative h-24 w-24 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-xl">
                {/* Slow spinning compass to indicate being lost */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Compass className="w-12 h-12 text-[var(--text-muted)]" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-red-400/20 font-black text-6xl pointer-events-none">?</div>
              </div>
            </motion.div>
          </div>

          {/* Main Error Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-7xl md:text-8xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] drop-shadow-lg">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-[var(--text-primary)]">
              Looks like you're <span className="text-red-400">off the map</span>.
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-md mx-auto leading-relaxed">
              We couldn't find the destination you're looking for. It might have been moved, or perhaps it's an uncharted territory.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 font-medium text-[var(--text-primary)] transition-all duration-300 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full hover:bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </button>
            <Link 
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 font-semibold text-white transition-all duration-300 bg-gradient-to-r from-[var(--accent-blue)] to-[#1e40af] rounded-full shadow-[0_0_20px_rgba(45,138,138,0.2)] hover:shadow-[0_0_30px_rgba(45,138,138,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Return to Base
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

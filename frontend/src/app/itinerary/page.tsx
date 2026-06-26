"use client";

import { motion } from "framer-motion";
import { Map, Calendar, Compass, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ItineraryComingSoon() {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 py-12">
      {/* Background Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-blue)]/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1e40af]/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-card p-8 md:p-14 text-center compass-spotlight relative overflow-hidden"
        >
          {/* Decorative Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent opacity-70" />

          {/* Icon Header */}
          <div className="flex justify-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-blue)] to-[#1e40af] blur-xl opacity-40 rounded-full animate-pulse-glow" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                <Map className="w-10 h-10 text-[var(--accent-blue)]" />
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-sm font-medium tracking-wide mb-6">
              COMING SOON
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight text-[var(--text-primary)]">
              AI-Powered <span className="text-gradient-primary">Itineraries</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              We're crafting the ultimate travel planning experience. Generate hyper-personalized, minute-by-minute trip schedules tailored perfectly to your preferences.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 text-left"
          >
            {[
              { icon: Compass, title: "Smart Routing", desc: "Optimized paths to save your valuable time." },
              { icon: Calendar, title: "Flexible Plans", desc: "Adapt on the go with real-time AI adjustments." },
              { icon: Sparkles, title: "Hidden Gems", desc: "Discover exclusive spots off the beaten path." },
            ].map((feature, i) => (
              <div key={i} className="glass-card-subtle p-5 hover-lift transition-all duration-300 group cursor-default">
                <div className="mb-4 inline-block p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] group-hover:border-[var(--accent-blue)]/40 transition-colors">
                  <feature.icon className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--accent-blue)] transition-colors" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-base">{feature.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <button className="w-full sm:w-auto px-8 py-3.5 font-semibold text-white transition-all duration-300 bg-gradient-to-r from-[var(--accent-blue)] to-[#1e40af] rounded-full shadow-[0_0_20px_rgba(45,138,138,0.2)] hover:shadow-[0_0_30px_rgba(45,138,138,0.4)] hover:scale-[1.02] active:scale-[0.98]">
              Notify Me When It's Live
            </button>
            <Link 
              href="/"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center px-8 py-3.5 font-medium text-[var(--text-primary)] transition-all duration-300 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full hover:bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Back to Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

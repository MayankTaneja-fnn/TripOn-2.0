import Link from "next/link";
import { Code, MessageCircle, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary">TripOn</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Your AI-powered travel companion. Discover perfect stays, plan trips, and explore with intelligent recommendations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "AI Search", href: "/" },
                { label: "Hotels", href: "/hotels" },
                { label: "Itinerary Planner", href: "/itinerary" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-accent-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex items-center gap-3">
              {[
                { icon: Code, href: "#", label: "GitHub" },
                { icon: MessageCircle, href: "#", label: "Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent-blue/50 hover:bg-bg-tertiary transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} TripOn. All rights reserved.
          </p>
          <p className="text-xs text-text-secondary flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> and AI
          </p>
        </div>
      </div>
    </footer>
  );
}

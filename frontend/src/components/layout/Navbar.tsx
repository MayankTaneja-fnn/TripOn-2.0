import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Navbar() {
  const session = await auth();

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
      ? session.user.email.charAt(0).toUpperCase()
      : "U";

  return (
    <nav className="sticky top-0 z-50 glass-card border-0 border-b border-white/[0.06] rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group" id="nav-logo">
            <span className="text-xl font-bold text-text-primary">TripOn</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="nav-link flex items-center gap-1.5" id="nav-ai-search">
              AI Search
            </Link>
            <Link href="/hotels" className="nav-link flex items-center gap-1.5" id="nav-hotels">
              Hotels
            </Link>
            <Link href="/itinerary" className="nav-link flex items-center gap-1.5" id="nav-itinerary">
              Itinerary
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-xs font-bold text-white">
                  {userInitial}
                </div>
                <span className="hidden sm:block text-sm font-medium text-text-secondary max-w-[120px] truncate">
                  {session.user?.name || session.user?.email}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <button
                    type="submit"
                    id="nav-logout"
                    className="text-xs font-medium text-text-muted hover:text-accent-blue transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-tertiary"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  id="nav-login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg border border-border-subtle hover:border-accent-blue/50 hover:bg-bg-tertiary transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  id="nav-signup"
                  className="text-sm font-medium text-white px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

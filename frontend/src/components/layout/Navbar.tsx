import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Navbar() {
  const session = await auth();
  return (
    <nav className="flex justify-between items-center p-4 border-b">
      <Link href="/" className="text-xl font-bold">TripOn</Link>
      <div className="flex gap-4 items-center">
        <Link href="/">AI Search</Link>
        <Link href="/hotels">Hotels</Link>
        <Link href="/itinerary">Itinerary Planner</Link>
        {session ? (
          <>
            <span className="font-semibold">{session.user?.name || session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button type="submit" className="text-red-500">Logout</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-500">Login</Link>
            <Link href="/signup" className="text-green-500">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}

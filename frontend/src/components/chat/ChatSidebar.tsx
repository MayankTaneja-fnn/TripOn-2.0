"use client";

import Link from "next/link";

export default function ChatSidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white p-4 hidden md:flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Chat History</h2>
      <div className="flex-grow space-y-2 text-sm text-gray-300">
        <div className="p-2 bg-gray-800 rounded">Delhi Hotel Search</div>
        <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Mumbai Trip</div>
      </div>
      <Link href="/" className="mt-4 p-2 text-center border rounded border-gray-700 hover:bg-gray-800">
        + New Chat
      </Link>
    </aside>
  );
}

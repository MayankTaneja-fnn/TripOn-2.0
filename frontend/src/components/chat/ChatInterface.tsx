"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Session } from "next-auth";

export default function ChatInterface({ session }: { session: Session | null }) {
  const router = useRouter();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!session) {
      router.push("/login");
      return;
    }

    const newUserMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, newUserMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newUserMessage.content, user_id: session.user?.email }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-4 rounded-lg max-w-2xl mx-auto ${m.role === 'user' ? 'bg-gray-100' : 'bg-white border'}`}>
            <span className="font-bold">{m.role === 'user' ? 'You' : 'TripOn AI'}:</span> {m.content}
          </div>
        ))}
        {loading && <div className="text-center p-4">TripOn is thinking...</div>}
      </div>

      <div className="border-t p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border p-3 rounded-lg flex-grow shadow-sm"
            placeholder="Plan your next trip..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend} 
            className="bg-green-600 text-white p-3 rounded-lg font-semibold"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import TypingIndicator from "@/components/ui/TypingIndicator";
import ReactMarkdown from 'react-markdown';
import { MapPin, Coffee, Utensils, Bed } from "lucide-react";
import HotelRecommendationCard from "@/components/chat/HotelRecommendationCard";

import HotelCard from "@/components/ui/HotelCard";
import { Sparkles, Map } from "lucide-react";

const SUGGESTED_PROMPTS = [
  { icon: MapPin, text: "Budget hotels in Mumbai" },
  { icon: Bed, text: "Luxury resorts in Goa" },
  { icon: Map, text: "Hotels near Delhi airport" },
  { icon: Sparkles, text: "Pet-friendly stays in Pune" },
];

export default function ChatInterface({
  session,
  initialMessages = [],
  suggestedHotels = [],
  suggestedHotelsTitle = "Trending Hotels"
}: {
  session: Session | null,
  initialMessages?: {
    role: "user" | "assistant";
    content: string;
    structured_data?: any
  }[],
  suggestedHotels?: any[],
  suggestedHotelsTitle?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");

  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(chatId);

  // Keep currentChatId in sync with URL chatId
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const scrollToBottom = () => {
    // Delay scroll to ensure DOM update (card rendering) is complete
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    scrollToBottom();
  }, [messages.length]);

  // Reset isInitialLoad when switching chats
  useEffect(() => {
    isInitialLoad.current = true;
  }, [chatId]);

  const handleSend = async (text?: string) => {
    const msgText = text || message;
    if (!msgText.trim()) return;

    if (!session) {
      router.push("/login");
      return;
    }

    const newUserMessage = { role: "user" as const, content: msgText };
    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: newUserMessage.content,
            user_id: session.user?.email,
            chat_id: currentChatId,
          }),
        }
      );
      const data = await res.json();
      console.log("API response data:", data);

      // Extract reply and structured_data safely handling both old (nested) and new (flat) API responses
      const replyText = typeof data.reply === 'string' ? data.reply : data.reply?.reply || "";
      const structuredData = data.structured_data || (typeof data.reply === 'object' ? data.reply?.structured_data : null);

      console.log("Assistant response extracted:", { replyText, structuredData });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: replyText,
          structured_data: structuredData
        },
      ]);

      // Update chatId if it was a new chat
      if (data.chat_id && data.chat_id !== currentChatId) {
        setCurrentChatId(data.chat_id);
        if (!currentChatId) { // Only redirect if we were previously in a new chat (no currentChatId)
          router.push(`/?chatId=${data.chat_id}`);
        }
      }

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! We couldn't connect to the server. An unexpected error occurred. Don't worry, our team has been notified and we'll be back soon!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  const renderInputBox = (isFloating: boolean) => (
    <div className={isFloating ? "absolute bottom-6 left-0 right-0 px-4 pointer-events-none z-50" : "w-full max-w-3xl mx-auto mt-6 mb-4 relative z-20"}>
      <div className={`flex gap-3 items-center bg-[#1A1F2C]/80 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/20 shadow-2xl transition-all focus-within:border-accent-blue/70 focus-within:shadow-[0_0_30px_rgba(37,99,235,0.3)] ${isFloating ? 'max-w-3xl mx-auto pointer-events-auto' : 'w-full shadow-[0_0_20px_rgba(37,99,235,0.1)]'}`}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow px-5 py-4 text-base md:text-lg bg-transparent text-white placeholder-text-muted rounded-xl focus:outline-none"
          placeholder="Where do you want to stay next?..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          id="chat-input"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSend()}
          disabled={loading || !message.trim()}
          id="chat-send"
          className="w-14 h-14 rounded-xl bg-gradient-to-tr from-accent-blue to-blue-400 flex items-center justify-center text-white shadow-lg shadow-accent-blue/40 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer transition-all"
        >
          <Send className="w-6 h-6 ml-1" />
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#131B2F] to-[#0B101E] relative">
      <div className={`flex-grow overflow-y-auto scroll-smooth ${isEmpty ? 'px-0 pt-0 pb-36' : 'px-4 pt-6 pb-36'}`}>
        {isEmpty ? (
          /* ── Breathtaking Landing Hero ── */
          <div className="min-h-full flex flex-col relative overflow-hidden" key="empty-state">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Lighter Gradient Base */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1E2943]/40 to-transparent" />

              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-white/20 blur-[120px]"
              />
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-white/20 blur-[100px]"
              />

              {/* Star Particles */}
              {/* Existing Stars */}
              <motion.div
                animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-[30%] left-[20%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
              />
              <motion.div
                animate={{ y: [0, 20, 0], opacity: [0.1, 0.6, 0.1] }}
                transition={{ duration: 7, repeat: Infinity, delay: 2 }}
                className="absolute top-[40%] right-[25%] w-2 h-2 bg-accent-blue rounded-full shadow-[0_0_10px_#2563eb]"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute top-[15%] left-[60%] w-1 h-1 bg-accent-purple rounded-full shadow-[0_0_8px_#9333ea]"
              />

              {/* New White Stars */}
              <motion.div
                animate={{ y: [0, -15, 0], opacity: [0, 0.7, 0] }}
                transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}
                className="absolute top-[25%] right-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
              />
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.1, 0.9, 0.1] }}
                transition={{ duration: 4.5, repeat: Infinity, delay: 1.5 }}
                className="absolute top-[50%] left-[10%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_white]"
              />
              <motion.div
                animate={{ y: [0, 25, 0], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, delay: 3 }}
                className="absolute top-[10%] left-[35%] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white]"
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 5.5, repeat: Infinity, delay: 2.5 }}
                className="absolute top-[45%] right-[40%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
              />
              <motion.div
                animate={{ y: [0, -10, 0], opacity: [0.1, 0.8, 0.1] }}
                transition={{ duration: 6.5, repeat: Infinity, delay: 0.2 }}
                className="absolute bottom-[20%] left-[25%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
              />

              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.04] mix-blend-overlay" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center pt-16 pb-6 text-center max-w-4xl mx-auto px-6 relative z-10 w-full"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/15 border border-accent-blue/30 text-accent-blue text-xs font-bold uppercase tracking-widest mb-5 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <Sparkles className="w-3.5 h-3.5" />
                AI Hotel Recommender
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-white leading-tight drop-shadow-lg">
                Find your perfect <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-blue-300 to-accent-purple animate-gradient-x drop-shadow-md">hotel stay.</span>
              </h1>
              <p className="text-text-secondary text-base sm:text-lg mb-8 max-w-2xl leading-relaxed">
                Describe your desired vibe, preferred amenities, or ideal location. Our AI will curate the best hotel recommendations for you.
              </p>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl mx-auto">
                {SUGGESTED_PROMPTS.map(({ icon: Icon, text }, i) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (i * 0.05), duration: 0.3 }}
                    key={text}
                    onClick={() => handleSend(text)}
                    className="flex items-center gap-3 px-5 py-3.5 bg-white/[0.04] backdrop-blur-xl border border-white/10 text-sm text-text-primary rounded-2xl hover:border-accent-blue/60 hover:bg-accent-blue/10 hover:shadow-[0_0_25px_rgba(37,99,235,0.2)] transition-all cursor-pointer group text-left w-full"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent-blue/20 group-hover:border-accent-blue/40 transition-all shrink-0 shadow-inner">
                      <Icon className="w-4 h-4 text-text-secondary group-hover:text-accent-blue transition-colors" />
                    </div>
                    <span className="font-medium text-sm text-gray-200 group-hover:text-white transition-colors">{text}</span>
                  </motion.button>
                ))}
              </div>

              {/* Render Search Box Inline (Scrollable) */}
              {renderInputBox(false)}

            </motion.div>

            {/* Trending Hotels Section */}
            {suggestedHotels && suggestedHotels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6 px-6 sm:px-10 max-w-7xl mx-auto w-full relative z-10 pb-12"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                    <Map className="w-6 h-6 text-accent-blue" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{suggestedHotelsTitle}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestedHotels.map((hotel: any, index: number) => (
                    <HotelCard
                      key={hotel.id || hotel.hotel_id}
                      name={hotel.name || `Hotel ID: ${hotel.hotel_id}`}
                      id={hotel.id || hotel.hotel_id || ""}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* ── Message Feed ── */
          <div className="space-y-5 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex items-start gap-4 ${m.role === "user" ? "flex-row-reverse" : ""
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-md ${m.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                      : "bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10"
                      }`}
                  >
                    {m.role === "user" ? (
                      <span className="font-semibold text-sm">U</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-5 py-4 rounded-2xl text-[15px] leading-relaxed max-w-[85%] break-words ${m.role === "user"
                      ? "bg-accent-blue text-white rounded-tr-sm shadow-md"
                      : "bg-[#18181A] border border-white/5 text-gray-200 rounded-tl-sm shadow-lg"
                      }`}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-base font-bold text-white mt-3 mb-2" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-300" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1 text-gray-300" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1 text-gray-300" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1 marker:text-gray-500" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-accent-blue pl-4 py-1 my-3 bg-accent-blue/5 text-gray-400 italic rounded-r-lg" {...props} />,
                        a: ({ node, ...props }) => <a className="text-accent-blue hover:text-blue-400 underline underline-offset-4 decoration-accent-blue/30 transition-colors" {...props} />,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                    {m.structured_data && m.structured_data.map((hotel: any, idx: number) => (
                      <div key={idx} className="mt-4">
                        <HotelRecommendationCard hotel={hotel} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Render Search Box Floating (Only when chatting) ── */}
      {!isEmpty && renderInputBox(true)}

    </div>
  );
}

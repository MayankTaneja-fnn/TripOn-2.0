"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, PanelLeftClose, PanelLeft, Trash2 } from "lucide-react";
import { getUserChatHistory, deleteChat } from "@/app/actions/chat";
import { Session } from "next-auth";

export default function ChatSidebar({ session }: { session: Session | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [history, setHistory] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const router = useRouter();

  useEffect(() => {
    async function loadHistory() {
      if (session?.user?.email) {
        setLoading(true);
        setError(false);
        try {
          const data = await getUserChatHistory(session.user.email!);
          setHistory(data);
        } catch (e) {
          setError(true);
        } finally {
          setLoading(false);
        }
      }
    }
    loadHistory();
  }, [session, chatId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Delete this chat?")) return;
    
    await deleteChat(id);
    setHistory(prev => prev.filter(item => item.id !== id));
    if (chatId === id) {
      router.push("/");
    }
  };

  return (
    <>
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden md:flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] overflow-hidden"
          >
            <div className="flex-1 flex flex-col p-4 min-w-[260px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <MessageSquare className="w-4 h-4 text-accent-blue" />
                  Chat History
                </div>
                <button
                  onClick={() => setCollapsed(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all cursor-pointer"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* History Items */}
              <div className="flex-grow space-y-1.5 overflow-y-auto">
                {loading && (
                  <div className="text-center py-4 text-sm text-text-muted animate-pulse">Loading history...</div>
                )}
                {error && !loading && (
                  <div className="text-center py-4 text-sm text-red-500 text-balance">Oops! We'll be back soon. Failed to load history.</div>
                )}
                {!loading && !error && history.map((item) => (
                  <div key={item.id} className="flex items-center group">
                    <Link
                      href={`/?chatId=${item.id}`}
                      className={`flex-grow text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                        chatId === item.id
                          ? "bg-accent-blue/10 text-text-primary border-l-2 border-accent-blue"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border-l-2 border-transparent"
                      }`}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${chatId === item.id ? "text-accent-blue" : "text-text-muted"}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                    <button 
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* New Chat Button */}
              <Link
                href="/"
                className="mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/10 hover:border-accent-blue/40 hover:text-text-primary transition-all group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                New Chat
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed Toggle */}
      {collapsed && (
        <div className="hidden md:flex flex-col items-center py-4 px-2 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all cursor-pointer"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

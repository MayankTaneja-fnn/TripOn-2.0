import { auth } from "@/lib/auth";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import HotelCard from "@/components/ui/HotelCard";
import { getRecentHotels, getTrendingHotels } from "@/app/actions/hotels";
import { TrendingUp, Clock } from "lucide-react";
import { getChatSession } from "@/app/actions/chat";

interface HotelData {
  id?: string;
  hotel_id?: string;
  name?: string;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const awaitedSearchParams = await searchParams;
  const chatId = typeof awaitedSearchParams.chatId === "string" ? awaitedSearchParams.chatId : undefined;
  
  let initialMessages: { role: "user" | "assistant"; content: string }[] = [];
  if (chatId) {
    const messages = await getChatSession(chatId);
    initialMessages = messages.map(m => ({
        ...m,
        role: (m.role === "user" || m.role === "assistant") ? m.role : "assistant"
    })) as { role: "user" | "assistant"; content: string }[];
  }

  let hotels = [];
  if (session?.user?.id) {
    hotels = await getRecentHotels(session.user.id);
  } else {
    hotels = await getTrendingHotels();
  }

  const sectionTitle = session ? "Recently Explored" : "Trending Hotels";
  const SectionIcon = session ? Clock : TrendingUp;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <ChatSidebar session={session} />
      <div className="flex-grow h-full relative bg-[var(--bg-primary)]">
        <ChatInterface 
          session={session} 
          initialMessages={initialMessages} 
          suggestedHotels={hotels}
          suggestedHotelsTitle={sectionTitle}
        />
      </div>
    </div>
  );
}

"use server";

import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserChatHistory(userEmail: string) {
  noStore();
  // 1. Get user UUID from email
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (userError || !userData) {
    return [];
  }

  // 2. Fetch distinct chat sessions using UUID
  // Assuming 'id' is the session identifier
  const { data, error } = await supabase
    .from("chat_history")
    .select("id, messages, timestamp")
    .eq("user_id", userData.id)
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Error fetching chat history:", JSON.stringify(error, null, 2));
    return [];
  }

  return data.map((chat) => {
    let label = "New Chat";
    if (chat.messages && Array.isArray(chat.messages)) {
      const tagMsg = chat.messages.find((m: any) => m.role === "tag");
      if (tagMsg && tagMsg.content) {
        label = tagMsg.content;
      } else {
        const userMsg = chat.messages.find((m: any) => m.role === "user");
        if (userMsg && userMsg.content) {
          label = userMsg.content.substring(0, 50) + (userMsg.content.length > 50 ? "..." : "");
        }
      }
    }
    return {
      id: chat.id,
      label: label,
    };
  });
}

export async function getChatSession(chatId: string) {
  noStore();
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("id", chatId)
    .maybeSingle(); // Use maybeSingle to prevent PGRST116 error on 0 rows

  if (error || !data) {
    return [];
  }

  // Return the messages array directly
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages;
  }
  return [];
}

export async function deleteChat(chatId: string) {
  const { error } = await supabase
    .from("chat_history")
    .delete()
    .eq("id", chatId); // Using 'id' for session

  if (error) {
    console.error("Error deleting chat:", error);
    return { success: false, error };
  }
  return { success: true };
}

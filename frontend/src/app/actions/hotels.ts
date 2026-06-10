"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getRecentHotels(userId: string) {
  const { data, error } = await supabase
    .from("user_views")
    .select("hotel_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent hotels:", error);
    return [];
  }
  
  // In a real scenario, you'd fetch full hotel details using these IDs.
  // For now, returning IDs.
  return data;
}

export async function getTrendingHotels() {
  // Simulate fetching trending hotels
  return [
    { id: "1", name: "Grand Palace Hotel" },
    { id: "2", name: "Beachside Resort" },
    { id: "3", name: "Mountain View Lodge" },
  ];
}

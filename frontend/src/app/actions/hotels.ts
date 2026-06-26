"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getRecentHotels(userId: string) {
  const { data, error } = await supabase
    .from("user_views")
    .select("hotel_id, viewed_at, hotels(name)")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent hotels:", error);
    return [];
  }

  return (data as any[]).map((view) => ({
    id: view.hotel_id,
    name: (Array.isArray(view.hotels) ? view.hotels[0]?.name : view.hotels?.name) || "Unknown Hotel",
    viewed_at: view.viewed_at,
  }));
}

export async function getTrendingHotels() {
  // Simulate fetching trending hotels
  return [
    { id: "1", name: "Grand Palace Hotel" },
    { id: "2", name: "Beachside Resort" },
    { id: "3", name: "Mountain View Lodge" },
  ];
}

export async function recordHotelView(hotelId: string | number) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) return;

  const { error } = await supabase
    .from("user_views")
    .upsert(
      { user_id: session.user.id, hotel_id: hotelId, viewed_at: new Date().toISOString() },
      { onConflict: 'user_id, hotel_id' }
    );

  if (error) {
    console.error("Error recording hotel view:", error);
  }
}

export async function getAllHotels(options: { search?: string, limit?: number, offset?: number } = {}) {
  let query = supabase.from("hotels").select("*");
  if (options.search) {
    query = query.ilike("name", `%${options.search}%`);
  }
  const { data, error } = await query
    .order("trust_score", { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
    
  if (error) {
    console.error("Error fetching hotels:", error);
    return [];
  }
  return data || [];
}

export async function getHotelDetails(id: string) {
  const { data, error } = await supabase.from("hotels").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching hotel details:", error);
    return null;
  }
  
  const { data: reviews } = await supabase.from("reviews").select("review_text, rating, review_date").eq("hotel_id", id).order('rating', { ascending: false }).limit(10);
  return { ...data, reviews: reviews || [] };
}

import { auth } from "@/lib/auth";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { getRecentHotels, getTrendingHotels } from "@/app/actions/hotels";

export default async function Page() {
  const session = await auth();
  
  let hotels = [];
  if (session?.user?.id) {
    hotels = await getRecentHotels(session.user.id);
  } else {
    hotels = await getTrendingHotels();
  }

  return (
    <div className="flex h-[calc(100vh-64px)]"> 
      <ChatSidebar />
      <div className="flex-grow h-full flex flex-col">
        <div className="flex-grow overflow-y-auto">
          <ChatInterface session={session} />
          
          <section className="p-8 border-t mt-8">
            <h2 className="text-2xl font-bold mb-4">
              {session ? "Recently Explored" : "Trending Hotels"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hotels.map((hotel: any) => (
                <div key={hotel.id} className="p-4 border rounded shadow">
                  {hotel.name || `Hotel ID: ${hotel.hotel_id}`}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

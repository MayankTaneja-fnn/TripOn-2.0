import { getAllHotels } from "@/app/actions/hotels";
import Link from "next/link";
import { Building2, Search, Star, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const awaitedParams = await searchParams;
  const q = awaitedParams.q || "";
  const hotels = await getAllHotels({ search: q, limit: 30 });
  const session = await auth();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Explore Hotels</h1>
            <p className="text-text-secondary mt-1">Discover the perfect stay for your next trip.</p>
          </div>
          
          <form className="relative w-full md:w-96">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search hotels..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
            />
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-text-secondary" />
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hotels.map((hotel) => (
            <Link 
              key={hotel.id} 
              href={`/hotels/${hotel.id}`}
              className="group bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden hover:border-accent-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-blue/5 flex flex-col"
            >
              <div className="h-48 bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 flex items-center justify-center relative overflow-hidden">
                <Building2 className="w-12 h-12 text-accent-blue/30 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent opacity-60" />
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-text-primary text-lg mb-2 line-clamp-1 group-hover:text-accent-blue transition-colors">
                  {hotel.name}
                </h3>
                
                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-text-primary">
                      {hotel.rating_avg ? Number(hotel.rating_avg).toFixed(1) : "New"}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-[var(--border-subtle)]" />
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-accent-green" />
                    <span className="text-sm text-text-secondary">
                      Trust: {hotel.trust_score ? Number(hotel.trust_score).toFixed(1) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {hotels.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No hotels found</h3>
            <p className="text-text-secondary">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

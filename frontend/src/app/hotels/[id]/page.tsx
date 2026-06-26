import { getHotelDetails, recordHotelView } from "@/app/actions/hotels";
import { notFound } from "next/navigation";
import { Building2, Star, ShieldCheck, MapPin, Wifi, Utensils, Coffee, Moon, Navigation, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function HotelDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const hotel = await getHotelDetails(awaitedParams.id);
  
  if (!hotel) {
    notFound();
  }

  const session = await auth();
  
  // Record that the user viewed this hotel asynchronously
  if (session?.user) {
    recordHotelView(hotel.id);
  }

  const aspects = [
    { label: "Cleanliness", score: hotel.cleanliness_score, icon: Moon },
    { label: "Service", score: hotel.service_score, icon: Coffee },
    { label: "Food", score: hotel.food_score, icon: Utensils },
    { label: "Wifi", score: hotel.wifi_score, icon: Wifi },
    { label: "Location", score: hotel.location_score, icon: Navigation },
    { label: "Noise", score: hotel.noise_score, icon: Moon },
    { label: "Safety", score: hotel.safety_score, icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
      
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pb-8">
          <Link href="/hotels" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent-blue transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Hotels
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-3">
                {hotel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{hotel.city || "India"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-text-primary">{Number(hotel.rating_avg).toFixed(1)} Rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent-green" />
                  <span className="text-accent-green font-medium">{Number(hotel.trust_score).toFixed(1)} Trust Score</span>
                </div>
              </div>
            </div>
            
            <button className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium rounded-xl transition-colors shrink-0">
              Check Availability
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Detailed Scores */}
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Performance Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {aspects.map((aspect, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-text-secondary mb-1">
                    <aspect.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{aspect.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${Number(aspect.score) >= 7 ? 'bg-accent-green' : Number(aspect.score) >= 5 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${(Number(aspect.score) / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-text-primary w-6 text-right">
                      {Number(aspect.score).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Top Reviews</h2>
            <div className="space-y-6">
              {hotel.reviews?.length > 0 ? (
                hotel.reviews.map((review: any, idx: number) => (
                  <div key={idx} className="border-b border-[var(--border-subtle)] pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= (Number(review.rating) / 2) ? 'text-amber-400 fill-amber-400' : 'text-[var(--border-subtle)]'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {(Number(review.rating) / 2).toFixed(1)} / 5
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">
                        {new Date(review.review_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed italic">
                      "{review.review_text}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary text-center py-4">No reviews available for this property.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-2xl p-6">
            <h3 className="font-semibold text-text-primary text-lg mb-2">Why book with TripOn?</h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-accent-blue shrink-0" />
                <span>Verified reviews from real travelers</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-5 h-5 text-accent-blue shrink-0" />
                <span>AI-powered trust scores for reliability</span>
              </li>
              <li className="flex items-start gap-2">
                <Navigation className="w-5 h-5 text-accent-blue shrink-0" />
                <span>Detailed insights on location & amenities</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

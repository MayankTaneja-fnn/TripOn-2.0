"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, TrendingUp } from "lucide-react";
import { recordHotelView } from "@/app/actions/hotels";

interface HotelRecommendationCardProps {
  hotel: {
    hotel_id?: number | string;
    hotel_name: string;
    score: number;
    metrics: { rating: number; trust_score: number; [key: string]: number };
    reasoning: string;
    evidence: string[];
    drawbacks: string[];
  };
}

import Link from "next/link";

export default function HotelRecommendationCard({ hotel }: HotelRecommendationCardProps) {
  useEffect(() => {
    if (hotel.hotel_id) {
      recordHotelView(hotel.hotel_id).catch(console.error);
    }
  }, [hotel.hotel_id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Link href={`/hotels/${hotel.hotel_id}`} target="_blank" className="block bg-gradient-to-b from-[#1E1E24] to-[#16161A] border border-white/[0.08] rounded-xl p-5 my-3 shadow-lg hover:border-accent-blue/50 hover:shadow-accent-blue/10 transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-white font-bold text-lg leading-tight group-hover:text-accent-blue transition-colors">{hotel.hotel_name}</h4>
          <div className="bg-accent-blue/20 text-accent-blue px-2.5 py-1 rounded-md text-xs font-mono font-bold border border-accent-blue/20 whitespace-nowrap ml-3">
            Score {hotel.score}
          </div>
        </div>
        
        <div className="relative mb-5">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent-blue/50 rounded-full" />
          <p className="text-gray-300 text-sm pl-3 italic leading-relaxed">
            "{hotel.evidence && hotel.evidence.length > 0 ? hotel.evidence[0] : hotel.reasoning}"
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-black/40 border border-white/[0.05] p-2.5 rounded-lg">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-gray-400 font-medium">Rating:</span>
            <span className="text-white font-bold">{hotel.metrics.rating}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/[0.05] p-2.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-accent-blue" />
            <span className="text-gray-400 font-medium">Trust:</span>
            <span className="text-white font-bold">{hotel.metrics.trust_score}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

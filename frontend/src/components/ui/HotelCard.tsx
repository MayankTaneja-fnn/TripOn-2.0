"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Ticket } from "lucide-react";
import Link from "next/link";

interface HotelCardProps {
  name: string;
  id: string;
  index?: number;
}

// Generate realistic mock coordinates based on the hotel ID
const getCoordinates = (hotelId: string) => {
  const hash = Array.from(String(hotelId)).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latDeg = (hash % 30) + 15; // 15°N to 45°N
  const latMin = hash % 60;
  const lngDeg = (hash % 40) + 65; // 65°E to 105°E
  const lngMin = (hash * 7) % 60;
  return `${latDeg}°${latMin < 10 ? "0" : ""}${latMin}' N, ${lngDeg}°${lngMin < 10 ? "0" : ""}${lngMin}' E`;
};

export default function HotelCard({ name, id, index = 0 }: HotelCardProps) {
  const coords = getCoordinates(id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link href={`/hotels/${id}`} className="block group boarding-pass hover-lift p-5 cursor-pointer h-full">
        {/* Decorative Stamp Background */}
        <div className="absolute -right-3 -top-3 w-16 h-16 border-2 border-brass/5 rounded-full flex items-center justify-center rotate-12 group-hover:border-brass/10 transition-colors pointer-events-none">
          <span className="text-[7px] font-mono text-brass/10 group-hover:text-brass/20 font-bold tracking-widest uppercase">TripOn Log</span>
        </div>

        <div className="relative z-10">
          {/* Header: Ticket Stub details */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-mono text-brass tracking-wider flex items-center gap-1">
              <Ticket className="w-3 h-3 text-brass/80" />
              BOARDING PASS
            </span>
            <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded">
              CLASS A
            </span>
          </div>

          {/* Hotel Details */}
          <div className="flex items-start justify-between gap-3 min-h-[4.5rem]">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm tracking-wide leading-snug group-hover:text-brass transition-colors line-clamp-2">
                {name}
              </h3>
              <div className="flex items-center gap-1.5 mt-2.5 text-[var(--text-secondary)] text-xs">
                <MapPin className="w-3.5 h-3.5 text-mint" />
                <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">{coords}</span>
              </div>
            </div>
          </div>

          {/* Rating stamps */}
          <div className="flex items-center gap-1.5 mt-2 bg-mint/5 border border-mint/10 rounded px-2.5 py-1.5 w-fit">
            <span className="text-[9px] font-mono text-mint font-semibold uppercase tracking-wider">
              STAMP:
            </span>
            <div className="flex items-center gap-0.5 text-brass">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${i < 4 ? "fill-brass text-brass" : "text-brass/20"}`}
                />
              ))}
            </div>
          </div>

          {/* Boarding Pass Tear-Off Stub */}
          <div className="boarding-pass-stub flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                LUGGAGE CODE
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-semibold line-clamp-1 break-all">
                TRIP-{id.toString().toUpperCase()}
              </span>
            </div>

            {/* Micro-Barcode styling */}
            <div className="barcode flex-shrink-0" aria-hidden="true">
              <span className="w-0.5" />
              <span className="w-1" />
              <span className="w-0.5" />
              <span className="w-1.5" />
              <span className="w-0.5" />
              <span className="w-2" />
              <span className="w-0.5" />
              <span className="w-1" />
              <span className="w-0.5" />
              <span className="w-1.5" />
              <span className="w-0.5" />
              <span className="w-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

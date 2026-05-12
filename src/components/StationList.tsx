"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Volume2, Radio } from "lucide-react";
import type { Station } from "../context/PlayerContext";
import { motion } from "framer-motion";

/* ============================================================
   TYPES
   ============================================================ */
type Props = {
  stations: Station[];
  currentStationId?: string;
  onSelect: (s: Station, playNow?: boolean) => void;
};

/* ============================================================
   LIVE BARS — animated equalizer shown on active station
   ============================================================ */
function LiveBars() {
  const bars = [
    { height: 16, delay: "0.1s" },
    { height: 24, delay: "0.3s" },
    { height: 12, delay: "0.5s" },
    { height: 20, delay: "0.2s" },
    { height: 14, delay: "0.4s" },
  ];
  return (
    <div className="flex gap-0.5 items-end h-6">
      {bars.map((b, i) => (
        <div
          key={i}
          className="w-1 bg-white rounded-full animate-bounce"
          style={{
            height: b.height,
            animationDelay: b.delay,
            animationDuration: "0.9s",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   STATION CARD
   ============================================================ */
function StationCard({
  station,
  isActive,
  onSelect,
  index,
}: {
  station: Station;
  isActive: boolean;
  onSelect: (s: Station, playNow?: boolean) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
      className={`
        group relative rounded-3xl border transition-all duration-500 overflow-hidden
        ${isActive
          ? "bg-blue-600/10 border-blue-500/40 shadow-[0_0_50px_-10px_rgba(59,130,246,0.35)]"
          : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
        }
      `}
    >
      {/* Active station background shimmer */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
      )}

      <div className="relative p-3">
        {/* Station logo + link */}
        <Link
          href={`/stations/${station.id}`}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
          aria-label={`View details for ${station.name}`}
        >
          {/* Logo area */}
          <div className="aspect-square relative overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center p-6">
            <div className="relative w-24 h-24">
              <Image
                src={station.logo}
                alt={station.name}
                fill
                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 150px"
                className={`
                  object-contain transition-all duration-700
                  ${isActive
                    ? "scale-110 grayscale-0"
                    : "grayscale group-hover:grayscale-0 group-hover:scale-110"
                  }
                `}
              />
            </div>

            {/* Active overlay with live bars */}
            {isActive && (
              <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center">
                <LiveBars />
              </div>
            )}
          </div>

          {/* Station name + status */}
          <div className="px-2 pt-4 pb-2">
            <h3 className={`
              text-xs font-black uppercase tracking-widest truncate transition-colors
              ${isActive ? "text-blue-400" : "text-white group-hover:text-blue-400"}
            `}>
              {station.name}
            </h3>

            <div className="flex items-center gap-2 mt-1.5">
              <span className={`
                w-1.5 h-1.5 rounded-full shrink-0
                ${isActive
                  ? "bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]"
                  : "bg-slate-600"
                }
              `} />
              <p className={`text-[9px] font-black uppercase tracking-widest ${
                isActive ? "text-green-400" : "text-slate-500"
              }`}>
                {isActive ? "Tuned In" : "Available"}
              </p>
            </div>
          </div>
        </Link>

        {/* Floating play button — appears on hover or when active */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onSelect(station, true);
          }}
          aria-label={isActive ? "Now playing" : `Play ${station.name}`}
          className={`
            absolute top-5 right-5 w-10 h-10 rounded-xl
            flex items-center justify-center
            shadow-lg transition-all duration-300 z-10
            active:scale-90
            ${isActive
              ? "bg-blue-500 text-white opacity-100 translate-y-0"
              : "bg-white text-slate-900 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-blue-500 hover:text-white"
            }
          `}
        >
          {isActive
            ? <Volume2 size={16} className="animate-pulse" />
            : <Play size={16} fill="currentColor" className="ml-0.5" />
          }
        </button>
      </div>
    </motion.div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function StationList({ stations, currentStationId, onSelect }: Props) {
  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
        <Radio size={40} className="mb-4 opacity-20" />
        <p className="font-black uppercase tracking-widest text-[10px]">No stations found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
      {stations.map((station, index) => (
        <StationCard
          key={station.id}
          station={station}
          isActive={currentStationId === station.id}
          onSelect={onSelect}
          index={index}
        />
      ))}
    </div>
  );
}
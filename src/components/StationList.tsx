"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Volume2, Radio } from "lucide-react";
import type { Station } from "../context/PlayerContext";
import { motion } from "framer-motion";

type Props = {
  stations: Station[];
  currentStationId?: string;
  onSelect: (s: Station, playNow?: boolean) => void;
};

export default function StationList({
  stations,
  currentStationId,
  onSelect,
}: Props) {
  
  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-white/5 rounded-[3rem]">
        <Radio size={48} className="mb-4 opacity-20" />
        <p className="font-black uppercase tracking-widest text-[10px]">No stations found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {stations.map((s, index) => {
        const isActive = currentStationId === s.id;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={s.id}
            className={`group relative rounded-[2.5rem] border transition-all duration-500 ${
              isActive 
                ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_40px_-15px_rgba(59,130,246,0.4)]" 
                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-black"
            }`}
          >
            {/* WRAPPER TO POSITION BUTTON ABSOLUTE OUTSIDE LINK */}
            <div className="relative p-2">
              <Link
                href={`/stations/${s.id}`}
                className="block outline-none"
                aria-label={`View details for ${s.name}`}
              >
                <div className="aspect-square relative overflow-hidden rounded-[2rem] bg-black/40 flex items-center justify-center p-8">
                  <Image
                    src={s.logo}
                    alt={s.name}
                    width={200}
                    height={200}
                    className={`h-32 w-32 object-contain transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 ${
                      isActive ? 'scale-110 rotate-3' : 'grayscale group-hover:grayscale-0'
                    }`}
                  />
                  
                  {/* LIVE INDICATOR OVERLAY */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-md flex items-center justify-center">
                      <div className="flex gap-1 items-end h-8">
                         <div className="w-1.5 bg-white animate-[bounce_1s_infinite_100ms] h-4 rounded-full" />
                         <div className="w-1.5 bg-white animate-[bounce_1s_infinite_300ms] h-8 rounded-full" />
                         <div className="w-1.5 bg-white animate-[bounce_1s_infinite_500ms] h-5 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 py-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white truncate transition-colors group-hover:text-blue-400">
                    {s.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-slate-600'}`} />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {isActive ? "Tuned In" : "Offline"}
                    </p>
                  </div>
                </div>
              </Link>

              {/* FLOATING ACTION BUTTON */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(s, true);
                }}
                className={`absolute top-5 right-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 z-10 active:scale-90 ${
                  isActive 
                    ? "bg-blue-600 text-white translate-y-0 opacity-100" 
                    : "bg-white text-black opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {isActive ? (
                  <div className="flex items-center justify-center">
                    <Volume2 size={20} className="animate-pulse" />
                  </div>
                ) : (
                  <Play size={20} fill="currentColor" className="ml-1" />
                )}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
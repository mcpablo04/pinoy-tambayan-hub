import Image from "next/image";
import Link from "next/link";
import { Play, Volume2 } from "lucide-react";
import type { Station } from "../context/PlayerContext"; // Adjust path as needed

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {stations.map((s) => {
        const isActive = currentStationId === s.id;

        return (
          <div
            key={s.id}
            className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-500 ${
              isActive 
                ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]" 
                : "bg-slate-900 border-white/5 hover:border-white/20 hover:bg-slate-800/50"
            }`}
          >
            {/* CARD CONTENT */}
            <Link
              href={`/stations/${s.id}`}
              className="block p-2"
              aria-label={`Details for ${s.name}`}
            >
              <div className="aspect-square w-full relative overflow-hidden rounded-[1.5rem] bg-black/20 flex items-center justify-center p-8">
                <Image
                  src={s.logo}
                  alt={s.name}
                  width={120}
                  height={120}
                  className={`h-28 w-28 object-contain transition-transform duration-700 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}
                />
                
                {/* ACTIVE OVERLAY */}
                {isActive && (
                  <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex gap-1 items-end h-6">
                       <span className="w-1 bg-blue-400 animate-[bounce_1s_infinite_100ms] h-3" />
                       <span className="w-1 bg-blue-400 animate-[bounce_1s_infinite_300ms] h-6" />
                       <span className="w-1 bg-blue-400 animate-[bounce_1s_infinite_500ms] h-4" />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white truncate group-hover:text-blue-400 transition-colors">
                  {s.name}
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">
                  {isActive ? "Now Streaming" : "Tap to tune in"}
                </p>
              </div>
            </Link>

            {/* QUICK PLAY ACTION */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(s, true);
              }}
              className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? "bg-blue-500 text-white" 
                  : "bg-white/10 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-white/20 backdrop-blur-md"
              }`}
              title="Instant Play"
            >
              {isActive ? <Volume2 size={18} /> : <Play size={18} fill="currentColor" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
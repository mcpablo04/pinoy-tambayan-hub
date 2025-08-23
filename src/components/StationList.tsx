// src/components/StationList.tsx
import Image from "next/image";
import Link from "next/link";
import type { Station } from "./RadioPlayer";

type Props = {
  stations: Station[];
  currentStationId?: string;
  onSelect: (s: Station, playNow?: boolean) => void; // ← allow 1‑click play
};

export default function StationList({
  stations,
  currentStationId,
  onSelect,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {stations.map((s) => {
        const active = currentStationId === s.id;

        return (
          <div
            key={s.id}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-gray-800/60 hover:bg-gray-800 transition"
          >
            {/* Whole card links to station details */}
            <Link
              href={`/stations/${s.id}`}
              className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              aria-label={`Open details for ${s.name}`}
            >
              <div className="aspect-[4/3] w-full flex items-center justify-center p-6">
                <Image
                  src={s.logo}
                  alt={s.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-contain rounded-md"
                />
              </div>

              <div className="px-4 pb-4 -mt-2">
                <p className="line-clamp-2 text-sm text-gray-200 font-medium">
                  {s.name}
                </p>
              </div>
            </Link>

            {/* Quick Play (DOES NOT NAVIGATE) */}
            <div className="absolute top-2 right-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(s, true); // ← set & start immediately
                }}
                className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={`Play ${s.name}`}
                title="Quick Play"
              >
                Play
              </button>
            </div>

            {active && (
              <div className="absolute inset-x-0 bottom-0 px-4 py-2 bg-blue-600/20 backdrop-blur-sm text-blue-300 text-xs">
                Now playing
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

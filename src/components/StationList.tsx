// src/components/StationList.tsx
import Image from "next/image";
import type { Station } from "./RadioPlayer";

type Props = {
  stations: Station[];
  currentStationId?: string;
  onSelect: (s: Station) => void;
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
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`group relative overflow-hidden rounded-xl border border-white/5 bg-gray-800/60 hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {/* Aspect box to keep a consistent card height */}
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

            {active && (
              <div className="absolute inset-x-0 bottom-0 px-4 py-2 bg-blue-600/20 backdrop-blur-sm text-blue-300 text-xs">
                Now playing
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

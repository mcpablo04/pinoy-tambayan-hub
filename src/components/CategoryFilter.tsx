"use client";

import { UNIQUE_GENRES } from "../data/stations";

type Props = {
  selected: string;
  onSelect: (genre: string) => void;
};

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar">
      <button
        onClick={() => onSelect("All")}
        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
          selected === "All"
            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
        }`}
      >
        All Stations
      </button>

      {UNIQUE_GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => onSelect(genre)}
          className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
            selected === genre
              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
              : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import MetaHead from "../components/MetaHead";
import { 
  CloudRain, Sun, Cloud, CloudLightning, Navigation, 
  Search, MapPin, Wind, ExternalLink, AlertTriangle, Radio
} from "lucide-react";

const CURRENT_YEAR = 2026;

export default function WeatherPage() {
  // ... (Keep the logic from previous response)

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pt-28 pb-20">
      <MetaHead 
        title={`PH Weather Forecast ${CURRENT_YEAR} | Pinoy Tambayan Hub`} 
        description={`Your daily 2026 weather guide for the Philippines. Real-time PAGASA storm tracking and 7-day city forecasts.`}
      />

      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Radio Hub Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">Weather Center</h1>
            <p className="text-slate-500 font-bold mt-2">PAGASA Sync: <span className="text-blue-500">Active {CURRENT_YEAR}</span></p>
          </div>
          
          {/* Radio Disclaimer Chip */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 animate-pulse">
              <Radio size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase">Radio Status</p>
              <p className="text-xs font-bold text-slate-300">OPM Vibes Streaming Live</p>
            </div>
          </div>
        </div>

        {/* ... (Keep the grid and map logic) ... */}

        {/* 2026 Disclaimer Footer */}
        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">
            Data provided by Open-Meteo & PAGASA &copy; {CURRENT_YEAR} Pinoy Tambayan Hub
          </p>
        </footer>
      </div>
    </div>
  );
}
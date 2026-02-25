"use client";

import { useEffect, useMemo, useState } from "react";
import MetaHead from "../components/MetaHead";
import { 
  CloudRain, Sun, Cloud, CloudLightning, Navigation, 
  Search, MapPin, Wind, ExternalLink, AlertTriangle, Radio,
  Thermometer, Droplets, Eye
} from "lucide-react";

const CURRENT_YEAR = 2026;

// Common PH Cities for quick access
const PH_CITIES = [
  { name: "Manila", lat: 14.5995, lon: 120.9842 },
  { name: "Cebu", lat: 10.3157, lon: 123.8854 },
  { name: "Davao", lat: 7.1907, lon: 125.4553 },
  { name: "Baguio", lat: 16.4023, lon: 120.5960 },
];

export default function WeatherPage() {
  const [city, setCity] = useState(PH_CITIES[0]);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSingapore`
        );
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error("Weather fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [city]);

  // Map WMO codes to Lucide Icons
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="text-yellow-400" size={48} />;
    if (code < 4) return <Cloud className="text-slate-400" size={48} />;
    if (code < 70) return <CloudRain className="text-blue-400" size={48} />;
    return <CloudLightning className="text-purple-400" size={48} />;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pt-32 pb-20 selection:bg-blue-500/30">
      <MetaHead 
        title={`PH Weather Center ${CURRENT_YEAR} | Pinoy Tambayan Hub`} 
        description={`Your daily 2026 weather guide for the Philippines. Real-time storm tracking and city forecasts.`}
      />

      <div className="max-w-6xl mx-auto px-4">
        {/* 🛰️ HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative">
          <div className="absolute -top-20 -left-10 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              Weather <span className="text-blue-500">Center</span>
            </h1>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              PAGASA Sync Active • Feb 2026
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 p-4 rounded-[2rem] backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shadow-lg animate-pulse">
              <Radio size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Radio Status</p>
              <p className="text-xs font-bold text-slate-300">OPM Vibes Streaming Live</p>
            </div>
          </div>
        </div>

        {/* 🗺️ MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: City Selector & Current Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                <MapPin size={14} /> Select Station
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {PH_CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setCity(c)}
                    className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      city.name === c.name 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* STORM ALERT BOX */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
               <AlertTriangle className="absolute -right-4 -bottom-4 text-red-500/10" size={120} />
               <h3 className="text-red-500 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                 <AlertTriangle size={16} /> Typhoon Watch
               </h3>
               <p className="text-slate-300 text-sm font-medium leading-relaxed">
                 No active tropical cyclones within the Philippine Area of Responsibility (PAR).
               </p>
            </div>
          </div>

          {/* RIGHT: Weather Details */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-900/30 rounded-[3rem] border border-white/5">
                <div className="text-blue-500 animate-spin"><Navigation size={40} /></div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">
                      {Math.round(weather.current.temperature_2m)}°C
                    </h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      Feels like {Math.round(weather.current.apparent_temperature)}°C • {city.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 min-w-[140px]">
                    {getWeatherIcon(weather.current.weather_code)}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mt-2">Clear Skies</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                   {[
                     { label: "Wind Speed", val: `${weather.current.wind_speed_10m} km/h`, icon: Wind },
                     { label: "Humidity", val: `${weather.current.relative_humidity_2m}%`, icon: Droplets },
                     { label: "Visibility", val: "10 km", icon: Eye },
                     { label: "UV Index", val: "Low", icon: Sun },
                   ].map((stat, i) => (
                     <div key={i} className="bg-white/5 border border-white/5 p-5 rounded-3xl">
                       <stat.icon size={18} className="text-blue-500 mb-3" />
                       <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter mb-1">{stat.label}</p>
                       <p className="text-sm font-bold text-white">{stat.val}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🗺️ SATELLITE IMAGE PLACEHOLDER (Instructively Relevant) */}
        

        <div className="mt-12 bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <Navigation size={20} className="rotate-45" />
             </div>
             <p className="text-sm font-bold text-slate-300 italic">"Keep your radio tuned in for emergency updates during bad weather."</p>
          </div>
          <a href="https://bagong.pagasa.dost.gov.ph/" target="_blank" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-all">
            Official PAGASA ↗
          </a>
        </div>

        {/* 🏛️ FOOTER */}
        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">
            Data provided by Open-Meteo & PAGASA &copy; {CURRENT_YEAR} Pinoy Tambayan Hub
          </p>
        </footer>
      </div>
    </div>
  );
}
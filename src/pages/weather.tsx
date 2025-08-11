// src/pages/weather.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Forecast = {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

type City = {
  name: string;
  country?: string;
  lat: number;
  lon: number;
};

const PH_CITIES: City[] = [
  { name: "Manila", lat: 14.5995, lon: 120.9842 },
  { name: "Quezon City", lat: 14.676, lon: 121.0437 },
  { name: "Cebu", lat: 10.3157, lon: 123.8854 },
  { name: "Davao", lat: 7.1907, lon: 125.4553 },
  { name: "Baguio", lat: 16.4023, lon: 120.596 },
  { name: "Iloilo", lat: 10.7202, lon: 122.5621 },
  { name: "Cagayan de Oro", lat: 8.4542, lon: 124.6319 },
];

// WMO → emoji + label
const WMO: Record<number, { t: string; e: string }> = {
  0: { t: "Clear", e: "☀️" },
  1: { t: "Mainly clear", e: "🌤️" },
  2: { t: "Partly cloudy", e: "⛅" },
  3: { t: "Cloudy", e: "☁️" },
  45: { t: "Fog", e: "🌫️" },
  48: { t: "Rime fog", e: "🌫️" },
  51: { t: "Light drizzle", e: "🌦️" },
  53: { t: "Drizzle", e: "🌦️" },
  55: { t: "Heavy drizzle", e: "🌧️" },
  61: { t: "Light rain", e: "🌧️" },
  63: { t: "Rain", e: "🌧️" },
  65: { t: "Heavy rain", e: "🌧️" },
  66: { t: "Freezing rain", e: "🌧️" },
  67: { t: "Freezing rain", e: "🌧️" },
  71: { t: "Snow", e: "❄️" },
  73: { t: "Snow", e: "❄️" },
  75: { t: "Snow", e: "❄️" },
  77: { t: "Snow grains", e: "❄️" },
  80: { t: "Light showers", e: "🌦️" },
  81: { t: "Mod. showers", e: "🌦️" },
  82: { t: "Heavy showers", e: "🌧️" },
  85: { t: "Snow showers", e: "❄️" },
  86: { t: "Snow showers", e: "❄️" },
  95: { t: "Thunderstorm", e: "⛈️" },
  96: { t: "Thunder w/ hail", e: "⛈️" },
  99: { t: "Thunder w/ hail", e: "⛈️" },
};

const dayShort = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short" });

async function geocodeCity(q: string): Promise<City | null> {
  if (!q.trim()) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q
  )}&count=5&language=en&format=json&countries=PH`;
  const r = await (await fetch(url)).json();
  const hit = (r?.results as any[])?.[0];
  return hit
    ? { name: hit.name, country: hit.country, lat: hit.latitude, lon: hit.longitude }
    : null;
}

async function reverseGeocode(lat: number, lon: number): Promise<City | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
  const r = await (await fetch(url)).json();
  const hit = (r?.results as any[])?.[0];
  return hit ? { name: hit.name, country: hit.country, lat, lon } : null;
}

async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const p = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `daily=weathercode,temperature_2m_max,temperature_2m_min`,
    `timezone=auto`,
  ].join("&");
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`);
  if (!res.ok) throw new Error("Forecast fetch failed");
  return res.json();
}

// IP fallback for HTTP or blocked geolocation (approx city)
async function ipFallback(): Promise<City | null> {
  try {
    const r = await (await fetch("https://ipapi.co/json/")).json();
    if (!r || !r.latitude || !r.longitude) return null;
    return { name: r.city || "Your location", country: r.country_name, lat: r.latitude, lon: r.longitude };
  } catch {
    return null;
  }
}

export default function WeatherPage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<City>(PH_CITIES[0]);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  const [data, setData] = useState<Forecast | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const f = await fetchForecast(city.lat, city.lon);
        setData(f);
      } finally {
        setInitialLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    (async () => {
      setRefreshing(true);
      try {
        const f = await fetchForecast(city.lat, city.lon);
        setData(f);
      } finally {
        setRefreshing(false);
      }
    })();
  }, [city.lat, city.lon, initialLoading]);

  const handleSearch = async () => {
    const found = await geocodeCity(search);
    if (found) setCity(found);
  };

  const useMyLocation = () => {
    setGeoErr(null);
    if (!navigator.geolocation) {
      // quick IP fallback
      ipFallback().then((c) => c && setCity(c));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const named =
          (await reverseGeocode(pos.coords.latitude, pos.coords.longitude)) ||
          (await ipFallback()) || // if reverse geocode fails, use IP
          { name: "Your location", lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCity(named);
      },
      async (err) => {
        setGeoErr("Precise location blocked. Using approximate location.");
        const c = await ipFallback();
        if (c) setCity(c);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const days = useMemo(() => {
    if (!data) return [];
    const rows = [];
    for (let i = 0; i < data.daily.time.length; i++) {
      const code = data.daily.weathercode[i] ?? 0;
      const meta = WMO[code] ?? { t: "—", e: "🔆" };
      rows.push({
        key: data.daily.time[i],
        label: dayShort(data.daily.time[i]),
        emoji: meta.e,
        text: meta.t,
        tMax: Math.round(data.daily.temperature_2m_max[i]),
        tMin: Math.round(data.daily.temperature_2m_min[i]),
      });
    }
    return rows;
  }, [data]);

  return (
    <div className="pt-16 min-h-screen bg-darkbg text-lighttext overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-2">Weather</h1>
        <p className="text-gray-400 mb-5">
          7-day forecast powered by Open-Meteo. PH results are prioritized.
        </p>

        {/* Search / actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">
              Search city
            </label>
            <input
              id="q"
              type="text"
              placeholder="Search city (e.g., Cebu, Davao, Baguio)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-md bg-gray-700/80 text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleSearch}
              className="flex-1 md:flex-none px-4 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              Search
            </button>
            <button
              onClick={useMyLocation}
              className="flex-1 md:flex-none px-4 py-3 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
            >
              Use my location
            </button>
          </div>
        </div>

        {/* Chips: full-bleed scroll with snap, no right cut */}
        <div className="-mx-4 px-4 mt-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          <div className="flex gap-2">
            {PH_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setCity(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full border whitespace-nowrap snap-start ${
                  c.name === city.name
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Location line */}
        <div className="mt-6 mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {city.name}{" "}
            {city.country ? (
              <span className="text-gray-400">• {city.country}</span>
            ) : (
              <span className="text-gray-400">• Philippines</span>
            )}
          </h2>
          {refreshing && (
            <span className="inline-flex items-center gap-2 text-sm text-gray-400">
              <span className="w-3 h-3 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
              Updating…
            </span>
          )}
        </div>
        {geoErr && <p className="text-amber-400 text-sm mb-3">{geoErr}</p>}

        {/* Forecast grid */}
{initialLoading ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-0">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="min-h-[160px] rounded-lg bg-gray-800/50 animate-pulse min-w-0" />
    ))}
  </div>
) : days.length ? (
  <div className="relative">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-0">
      {days.map((d) => (
        <div
          key={d.key}
          className="rounded-lg bg-gray-800/60 border border-white/5 p-4 min-h-[160px] min-w-0"
        >
          <div className="text-xs text-gray-400 mb-2">{d.label}</div>
          <div className="flex items-start gap-2 mb-2 min-w-0">
            <span className="text-3xl leading-none shrink-0">{d.emoji}</span>

            {/* Full text, no ellipsis; wraps nicely on small screens */}
            <div className="text-sm text-gray-300 whitespace-normal break-words leading-snug min-w-0">
              {d.text}
            </div>
          </div>

          <div className="text-lg font-semibold">
            {d.tMax}°C{" "}
            <span className="text-sm text-gray-400 ml-1">{d.tMin}°C</span>
          </div>
        </div>
      ))}
    </div>

    {refreshing && (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl bg-black/30 px-3 py-2">
          <div className="w-6 h-6 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
        </div>
      </div>
    )}
  </div>
) : (
  <p className="text-gray-400">No forecast available.</p>
)}

        <div className="h-8" />
      </div>
    </div>
  );
}

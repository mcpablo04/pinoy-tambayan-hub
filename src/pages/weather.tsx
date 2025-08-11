// src/pages/weather.tsx
import { useEffect, useMemo, useState } from "react";

/* ---------------------------- Types & helpers ---------------------------- */

type City = { name: string; lat: number; lon: number };

type DailyData = {
  time: string[]; // ISO dates
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
};
type WeatherResponse = {
  daily?: DailyData;
  current_weather?: { temperature: number; weathercode: number };
};

const WMO: Record<number, { e: string; t: string }> = {
  0: { e: "☀️", t: "Clear sky" },
  1: { e: "🌤️", t: "Mainly clear" },
  2: { e: "⛅", t: "Partly cloudy" },
  3: { e: "☁️", t: "Overcast" },
  45: { e: "🌫️", t: "Fog" },
  48: { e: "🌫️", t: "Depositing rime fog" },
  51: { e: "🌦️", t: "Light drizzle" },
  53: { e: "🌦️", t: "Drizzle" },
  55: { e: "🌧️", t: "Dense drizzle" },
  56: { e: "🌧️", t: "Light freezing drizzle" },
  57: { e: "🌧️", t: "Freezing drizzle" },
  61: { e: "🌧️", t: "Light rain" },
  63: { e: "🌧️", t: "Rain" },
  65: { e: "🌧️", t: "Heavy rain" },
  66: { e: "🌧️", t: "Light freezing rain" },
  67: { e: "🌧️", t: "Freezing rain" },
  71: { e: "🌨️", t: "Light snow" },
  73: { e: "🌨️", t: "Snow" },
  75: { e: "🌨️", t: "Heavy snow" },
  77: { e: "🌨️", t: "Snow grains" },
  80: { e: "🌦️", t: "Rain showers" },
  81: { e: "🌦️", t: "Heavy rain showers" },
  82: { e: "🌧️", t: "Violent showers" },
  85: { e: "🌨️", t: "Snow showers" },
  86: { e: "🌨️", t: "Heavy snow showers" },
  95: { e: "⛈️", t: "Thunderstorm" },
  96: { e: "⛈️", t: "T-storm w/ hail" },
  99: { e: "⛈️", t: "T-storm heavy hail" },
};

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short" });
}

function formatPHName(p: any) {
  const primary = p.name || p.locality || p.admin2 || p.admin1 || "Unknown";
  const parts: string[] = [primary];
  if (p.admin2 && p.admin2 !== primary) parts.push(p.admin2);
  if (p.admin1 && !parts.includes(p.admin1)) parts.push(p.admin1);
  const country =
    p.country_code === "PH" ? "Philippines" : p.country || p.country_code;
  if (country && !parts.includes(country)) parts.push(country);
  return parts.join(", ");
}

function phFirstSort(a: any, b: any) {
  const ra = a?.country_code === "PH" ? 0 : 1;
  const rb = b?.country_code === "PH" ? 0 : 1;
  return ra - rb;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`
    );
    const data = await res.json();
    const arr = (data?.results || []) as any[];
    if (!arr.length) return "Your location";
    arr.sort(phFirstSort);
    return formatPHName(arr[0]);
  } catch {
    return "Your location";
  }
}

async function searchCities(q: string): Promise<City[]> {
  if (!q.trim()) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=10&language=en`
  );
  const data = await res.json();
  const list = (data?.results || []) as any[];
  list.sort(phFirstSort);
  return list.map((p) => ({
    name: formatPHName(p),
    lat: p.latitude,
    lon: p.longitude,
  }));
}

async function getDaily(lat: number, lon: number): Promise<WeatherResponse> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

/* --------------------- Optional Firestore analytics (no-op) -------------------- */

async function logCitySelection(city: City) {
  try {
    const {
      getFirestore,
      collection,
      addDoc,
      serverTimestamp,
    } = await import("firebase/firestore");
    const mod: any = await import("../firebase/clientApp");
    const db = getFirestore(mod.app);

    await addDoc(collection(db, "weather_city_clicks"), {
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      ts: serverTimestamp(),
    });
  } catch {
    /* ignore */
  }
}

/* ---------------------------------- Page ---------------------------------- */

export default function WeatherPage() {
  const [city, setCity] = useState<City | null>(null);
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);

  // on load: try geolocation; default to Manila if denied
  useEffect(() => {
    if (!navigator.geolocation) {
      setCity({ name: "Manila, Philippines", lat: 14.5995, lon: 120.9842 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        setCity({ name, lat: latitude, lon: longitude });
      },
      () =>
        setCity({
          name: "Manila, Philippines",
          lat: 14.5995,
          lon: 120.9842,
        }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // fetch forecast
  useEffect(() => {
    (async () => {
      if (!city) return;
      setLoading(true);
      try {
        const data = await getDaily(city.lat, city.lon);
        setDaily(data.daily ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [city]);

  // search suggestions (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      try {
        setSuggestions(await searchCities(q));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const days = useMemo(() => {
    const d = daily;
    if (!d) return [];
    const n = Math.min(
      d.time.length,
      d.weathercode.length,
      d.temperature_2m_max.length,
      d.temperature_2m_min.length
    );
    return Array.from({ length: n }, (_, i) => ({
      date: d.time[i],
      code: d.weathercode[i],
      tmax: d.temperature_2m_max[i],
      tmin: d.temperature_2m_min[i],
    }));
  }, [daily]);

  // fixed number for skeleton to avoid layout shift
  const SKELETON_COUNT = 7;

  return (
    <div className="pt-16 bg-darkbg text-lighttext min-h-screen px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Weather</h1>
        <p className="text-gray-400 mb-6">
          7-day forecast powered by Open-Meteo. Search any city (PH results are
          shown first) or use your current location.
        </p>

        {/* Search */}
        <div className="relative mb-8">
          <div className="flex gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search city (e.g., Cebu, Davao, Baguio)"
              className="flex-1 p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={async () => {
                if (!q.trim()) return;
                const list = await searchCities(q);
                if (list[0]) {
                  setCity(list[0]);
                  setSuggestions([]);
                  setQ("");
                  logCitySelection(list[0]);
                }
              }}
              className="px-4 rounded-md bg-blue-600 hover:bg-blue-500 transition"
            >
              {searching ? "…" : "Search"}
            </button>
            <button
              onClick={async () => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  const name = await reverseGeocode(latitude, longitude);
                  const c = { name, lat: latitude, lon: longitude };
                  setCity(c);
                  setSuggestions([]);
                  setQ("");
                  logCitySelection(c);
                });
              }}
              className="px-4 rounded-md bg-gray-700 hover:bg-gray-600 transition"
            >
              Use my location
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg">
              {suggestions.map((c) => (
                <button
                  key={`${c.lat},${c.lon}`}
                  onClick={() => {
                    setCity(c);
                    setSuggestions([]);
                    setQ("");
                    logCitySelection(c);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location name */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {city ? city.name : "Detecting location…"}
          </h2>
        </div>

        {/* Forecast grid — fixed card sizes to prevent overlap & layout shift */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={i}
                className="w-48 min-h-[180px] bg-gray-800 rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-700 rounded w-16 mb-4" />
                <div className="h-6 bg-gray-700 rounded w-10 mb-3" />
                <div className="h-10 bg-gray-700 rounded w-full mb-3" />
                <div className="h-4 bg-gray-700 rounded w-12 mb-2 ml-auto" />
                <div className="h-3 bg-gray-700 rounded w-10 ml-auto" />
              </div>
            ))}
          </div>
        ) : days.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {days.map(({ date, code, tmax, tmin }, i) => {
              const meta =
                WMO[code as keyof typeof WMO] ?? { e: "❓", t: "Unknown" };
              return (
                <div
                  key={date + i}
                  className="w-48 min-h-[180px] bg-gray-800 rounded-lg p-4 flex flex-col gap-2 shadow hover:shadow-lg transition"
                >
                  <div className="text-gray-400 text-sm">{fmtDay(date)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{meta.e}</span>
                    {/* Clamp to two lines so long texts never overflow */}
                    <div className="text-base leading-tight clamp-2">
                      {meta.t}
                    </div>
                  </div>
                  <div className="mt-auto text-right">
                    <div className="font-semibold text-sm">
                      {Math.round(tmax)}°C
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(tmin)}°C
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">No data available.</p>
        )}
      </div>

      {/* Local CSS for multi-line clamp */}
      <style jsx>{`
        .clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

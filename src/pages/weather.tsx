// src/pages/weather.tsx
import { FormEvent, useMemo, useState } from "react";

type WeatherCode =
  | 0 | 1 | 2 | 3
  | 45 | 48
  | 51 | 53 | 55 | 56 | 57
  | 61 | 63 | 65 | 66 | 67
  | 71 | 73 | 75 | 77
  | 80 | 81 | 82
  | 85 | 86
  | 95 | 96 | 99;

interface DailyUnits {
  time: string;
  weathercode: string;
  temperature_2m_max: string;
  temperature_2m_min: string;
}

interface Daily {
  time: string[];
  weathercode: WeatherCode[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

interface WeatherResponse {
  daily_units: DailyUnits;
  daily: Daily;
  timezone: string;
}

interface City {
  name: string;
  country?: string;
  lat: number;
  lon: number;
}

// Minimal PH-first city index (add more if you like)
const CITY_INDEX: City[] = [
  { name: "Manila", country: "PH", lat: 14.5995, lon: 120.9842 },
  { name: "Quezon City", country: "PH", lat: 14.6760, lon: 121.0437 },
  { name: "Cebu", country: "PH", lat: 10.3157, lon: 123.8854 },
  { name: "Davao", country: "PH", lat: 7.1907, lon: 125.4553 },
  { name: "Baguio", country: "PH", lat: 16.4023, lon: 120.5960 },
  { name: "Iloilo", country: "PH", lat: 10.7202, lon: 122.5621 },
  { name: "Cagayan de Oro", country: "PH", lat: 8.4542, lon: 124.6319 },
  { name: "General Santos", country: "PH", lat: 6.1164, lon: 125.1716 },
];

const WMO: Record<WeatherCode, { e: string; t: string }> = {
  0: { e: "☀️", t: "Clear sky" },
  1: { e: "🌤️", t: "Mainly clear" },
  2: { e: "⛅", t: "Partly cloudy" },
  3: { e: "☁️", t: "Overcast" },
  45: { e: "🌫️", t: "Fog" },
  48: { e: "🌫️", t: "Depositing rime fog" },
  51: { e: "🌦️", t: "Drizzle: light" },
  53: { e: "🌦️", t: "Drizzle: moderate" },
  55: { e: "🌧️", t: "Drizzle: dense" },
  56: { e: "🌧️", t: "Freezing drizzle: light" },
  57: { e: "🌧️", t: "Freezing drizzle: dense" },
  61: { e: "🌦️", t: "Rain: slight" },
  63: { e: "🌧️", t: "Rain: moderate" },
  65: { e: "🌧️", t: "Rain: heavy" },
  66: { e: "🌨️", t: "Freezing rain: light" },
  67: { e: "🌨️", t: "Freezing rain: heavy" },
  71: { e: "🌨️", t: "Snow fall: slight" },
  73: { e: "🌨️", t: "Snow fall: moderate" },
  75: { e: "❄️", t: "Snow fall: heavy" },
  77: { e: "🌨️", t: "Snow grains" },
  80: { e: "🌦️", t: "Rain showers: slight" },
  81: { e: "🌧️", t: "Rain showers: moderate" },
  82: { e: "⛈️", t: "Rain showers: violent" },
  85: { e: "🌨️", t: "Snow showers: slight" },
  86: { e: "🌨️", t: "Snow showers: heavy" },
  95: { e: "⛈️", t: "Thunderstorm" },
  96: { e: "⛈️", t: "Thunderstorm w/ slight hail" },
  99: { e: "⛈️", t: "Thunderstorm w/ heavy hail" },
};

function wc(code: WeatherCode): { e: string; t: string } {
  return WMO[code] ?? { e: "☁️", t: "Cloudy" };
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const qs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "weathercode,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch weather");
  return (await res.json()) as WeatherResponse;
}

export default function WeatherPage() {
  const [query, setQuery] = useState("");
  const [pickedCity, setPickedCity] = useState<City | null>(null);
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITY_INDEX;
    return CITY_INDEX.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!suggestions.length) return;
    const city = suggestions[0];
    await loadCity(city);
  };

  async function loadCity(city: City) {
    try {
      setErr(null);
      setLoading(true);
      setPickedCity(city);
      const res = await fetchWeather(city.lat, city.lon);
      setData(res);
    } catch (error) {
      setErr("Could not load weather right now.");
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setErr("Geolocation not supported.");
      return;
    }
    setErr(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city: City = {
          name: "Your location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setPickedCity(city);
        try {
          const res = await fetchWeather(city.lat, city.lon);
          setData(res);
        } catch {
          setErr("Could not load weather for your location.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setErr("We couldn't access your location.");
        setLoading(false);
      }
    );
  }

  return (
    <div className="pt-16 bg-darkbg text-lighttext min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-6">Weather</h1>

      {/* Search */}
      <form onSubmit={onSearch} className="max-w-6xl mx-auto flex gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city (e.g., Cebu, Davao, Baguio)"
          className="flex-1 p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
        >
          Search
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          className="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
        >
          Use my location
        </button>
      </form>

      {/* Selected city label */}
      <div className="max-w-6xl mx-auto mb-4 text-sm text-gray-400">
        {pickedCity ? (
          <>Forecast for <span className="text-gray-200">{pickedCity.name}</span></>
        ) : (
          <>Pick a city or use your location.</>
        )}
      </div>

      {/* Forecast grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading && <div className="text-gray-400">Loading…</div>}
        {err && <div className="text-red-400">{err}</div>}
        {!loading && !err && data && data.daily.time.map((day, i) => (
          <div
            key={day}
            className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow"
          >
            <div className="text-sm text-gray-400">
              {new Date(day).toLocaleDateString(undefined, { weekday: "short" })}
            </div>

            <div className="my-3 text-center">
              <div className="text-4xl">{wc(data.daily.weathercode[i]).e}</div>
              <div className="mt-1 text-center text-gray-200">
                {wc(data.daily.weathercode[i]).t}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm font-semibold">
                {Math.round(data.daily.temperature_2m_max[i])}°C
              </div>
              <div className="text-sm text-gray-400">
                {Math.round(data.daily.temperature_2m_min[i])}°C
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick city suggestions */}
      <div className="max-w-6xl mx-auto mt-8">
        <h2 className="text-lg font-semibold mb-3">Philippine cities</h2>
        <div className="flex flex-wrap gap-2">
          {CITY_INDEX.map((c) => (
            <button
              key={`${c.name}-${c.lat}-${c.lon}`}
              onClick={() => loadCity(c)}
              className="px-3 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

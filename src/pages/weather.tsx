"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

/* ===================== Types ===================== */
type Forecast = {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

type City = { name: string; country?: string; lat: number; lon: number };

type PhAlerts = {
  hasStormInPAR: boolean;
  stormName?: string;   // PAGASA name (e.g. EGAY)
  category?: string;    // Typhoon / STS / TS / TD
  bulletinUrl?: string;

  hasLPA: boolean;
  lpaText?: string;
  advisoryUrl?: string;

  fetchedAt?: string;   // ISO
};

/* ===================== PH presets ===================== */
const PH_CITIES: City[] = [
  { name: "Manila", lat: 14.5995, lon: 120.9842 },
  { name: "Quezon City", lat: 14.676, lon: 121.0437 },
  { name: "Cebu", lat: 10.3157, lon: 123.8854 },
  { name: "Davao", lat: 7.1907, lon: 125.4553 },
  { name: "Baguio", lat: 16.4023, lon: 120.596 },
  { name: "Iloilo", lat: 10.7202, lon: 122.5621 },
  { name: "Cagayan de Oro", lat: 8.4542, lon: 124.6319 },
];

/* ===================== WMO codes ===================== */
const WMO: Record<number, { t: string; e: string }> = {
  0: { t: "Clear", e: "☀️" }, 1: { t: "Mainly clear", e: "🌤️" }, 2: { t: "Partly cloudy", e: "⛅" }, 3: { t: "Cloudy", e: "☁️" },
  45: { t: "Fog", e: "🌫️" }, 48: { t: "Rime fog", e: "🌫️" },
  51: { t: "Light drizzle", e: "🌦️" }, 53: { t: "Drizzle", e: "🌦️" }, 55: { t: "Heavy drizzle", e: "🌧️" },
  61: { t: "Light rain", e: "🌧️" }, 63: { t: "Rain", e: "🌧️" }, 65: { t: "Heavy rain", e: "🌧️" },
  66: { t: "Freezing rain", e: "🌧️" }, 67: { t: "Freezing rain", e: "🌧️" },
  71: { t: "Snow", e: "❄️" }, 73: { t: "Snow", e: "❄️" }, 75: { t: "Snow", e: "❄️" }, 77: { t: "Snow grains", e: "❄️" },
  80: { t: "Light showers", e: "🌦️" }, 81: { t: "Mod. showers", e: "🌦️" }, 82: { t: "Heavy showers", e: "🌧️" },
  85: { t: "Snow showers", e: "❄️" }, 86: { t: "Snow showers", e: "❄️" },
  95: { t: "Thunderstorm", e: "⛈️" }, 96: { t: "Thunder w/ hail", e: "⛈️" }, 99: { t: "Thunder w/ hail", e: "⛈️" },
};

const dayShort = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short" });

/* ===================== Helpers ===================== */
async function geocodeCity(q: string): Promise<City | null> {
  if (!q.trim()) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json&countries=PH`;
  const r = await (await fetch(url)).json();
  const hit = (r?.results as any[])?.[0];
  return hit ? { name: hit.name, country: hit.country, lat: hit.latitude, lon: hit.longitude } : null;
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

async function ipFallback(): Promise<City | null> {
  try {
    const r = await (await fetch("https://ipapi.co/json/")).json();
    if (!r?.latitude || !r?.longitude) return null;
    return { name: r.city || "Your location", country: r.country_name, lat: r.latitude, lon: r.longitude };
  } catch { return null; }
}

/* ===================== Component ===================== */
export default function WeatherPage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<City>(PH_CITIES[0]);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [data, setData] = useState<Forecast | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // PAGASA alerts
  const [alerts, setAlerts] = useState<PhAlerts | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Initial forecast (no layout jumps)
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

  // Fetch PAGASA alerts (from /api/ph-alerts)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAlertsLoading(true);
      try {
        const r = await fetch("/api/ph-alerts");
        const json = (await r.json()) as PhAlerts;
        if (!cancelled) setAlerts(json);
      } catch {
        if (!cancelled) setAlerts(null);
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Refresh when city changes
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
    setGeoLoading(true);

    if (!window.isSecureContext) {
      setGeoErr("Location requires HTTPS. Using approximate IP location.");
    }

    const finish = () => setGeoLoading(false);

    const doIP = async () => {
      const c = await ipFallback();
      if (c) setCity(c);
      finish();
    };

    if (!navigator.geolocation) {
      doIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const named =
            (await reverseGeocode(pos.coords.latitude, pos.coords.longitude)) ||
            (await ipFallback()) || {
              name: "Your location",
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            };
          setCity(named);
        } catch {
        } finally {
          finish();
        }
      },
      async (err) => {
        setGeoErr(
          err.code === err.PERMISSION_DENIED
            ? "Precise location blocked. Using approximate location."
            : "Couldn’t get precise location. Using approximate location."
        );
        await doIP();
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
    <>
      <Head>
        <title>Philippines 7-Day Weather Forecast | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Check the 7-day weather forecast for Manila, Cebu, Davao, Baguio, and more using Open-Meteo. Use your location for local forecasts."
        />
        <link rel="canonical" href="https://pinoytambayanhub.com/weather" />

        <meta property="og:title" content="Philippines 7-Day Weather Forecast" />
        <meta
          property="og:description"
          content="Accurate 7-day forecast for PH cities. Quick search or use my location."
        />
        <meta property="og:image" content="/brand/og-cover.png" />
        <meta property="og:url" content="https://pinoytambayanhub.com/weather" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Philippines 7-Day Weather Forecast" />
        <meta
          name="twitter:description"
          content="See today through the week for your city in the Philippines."
        />
        <meta name="twitter:image" content="/brand/og-cover.png" />
      </Head>

      <section className="section">
        <div className="container-page">
          <h1 className="page-title">Weather</h1>
          <p className="text-gray-400 mb-5">
            7-day forecast for the Philippines. Timezone: Asia/Manila.
          </p>

          {/* PAGASA Alerts */}
          <div className="mb-5 rounded-lg border border-white/10 bg-gray-800/70 p-4 min-h-[96px]">
            <div className="flex items-start gap-3">
              <div className="text-2xl" aria-hidden>🌀</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">PAGASA Alerts (PAR & LPA)</h3>

                {alertsLoading ? (
                  <div className="mt-2 animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700/60 rounded w-1/3" />
                    <div className="h-3 bg-gray-700/50 rounded w-2/3" />
                  </div>
                ) : alerts ? (
                  <div className="space-y-1 text-sm mt-1">
                    <div className="truncate">
                      <span className="font-medium">Tropical Cyclone in PAR:</span>{" "}
                      {alerts.hasStormInPAR ? (
                        <span className="text-red-300">
                          YES — {alerts.category ?? "Tropical Cyclone"}
                          {alerts.stormName ? (
                            <b className="ml-1 uppercase">{alerts.stormName}</b>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-green-300">None detected</span>
                      )}{" "}
                      {alerts.bulletinUrl && (
                        <a
                          className="ml-2 text-blue-300 underline"
                          href={alerts.bulletinUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          PAGASA Bulletin ↗
                        </a>
                      )}
                    </div>

                    <div className="truncate">
                      <span className="font-medium">Low Pressure Area (LPA):</span>{" "}
                      {alerts.hasLPA ? (
                        <span className="text-amber-300">
                          YES — {(alerts.lpaText ?? "See advisory").slice(0, 160)}…
                        </span>
                      ) : (
                        <span className="text-green-300">None detected</span>
                      )}{" "}
                      {alerts.advisoryUrl && (
                        <a
                          className="ml-2 text-blue-300 underline"
                          href={alerts.advisoryUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Advisory ↗
                        </a>
                      )}
                    </div>

                    {alerts.fetchedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Updated:{" "}
                        {new Date(alerts.fetchedAt).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                        })}{" "}
                        (verify with PAGASA)
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mt-1">
                    Couldn’t load alerts right now. Try again later.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 min-w-0">
              <label htmlFor="q" className="sr-only">Search city</label>
              <input
                id="q"
                type="text"
                placeholder="Search city (e.g., Cebu, Davao, Baguio)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="input"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={handleSearch}
                className="btn btn-primary w-full md:w-auto"
              >
                Search
              </button>
              <button
                onClick={useMyLocation}
                disabled={geoLoading}
                className="btn btn-ghost w-full md:w-auto disabled:opacity-60"
                aria-busy={geoLoading}
                aria-live="polite"
              >
                {geoLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                    Locating…
                  </span>
                ) : (
                  "Use my location"
                )}
              </button>
            </div>
          </div>

          {/* City chips */}
          <div className="mt-4 overflow-x-auto no-scrollbar">
            <div className="inline-flex gap-2 pr-2">
              {PH_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCity(c)}
                  className={`shrink-0 px-3 py-1.5 rounded-full border whitespace-nowrap ${
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

          {/* Location */}
          <div className="mt-6 mb-3 flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-semibold truncate">
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

          {/* Forecast */}
          <div className="relative">
            {initialLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-0">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-h[160px] rounded-lg bg-gray-800/50 animate-pulse min-w-0"
                  />
                ))}
              </div>
            ) : days.length ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-0">
                  {days.map((d) => (
                    <div
                      key={d.key}
                      className="rounded-lg bg-gray-800/60 border border-white/5 p-4 min-h-[160px] min-w-0"
                    >
                      <div className="text-xs text-gray-400 mb-2">{d.label}</div>
                      <div className="flex items-start gap-2 mb-2 min-w-0">
                        <span className="text-3xl leading-none shrink-0">{d.emoji}</span>
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
              </>
            ) : (
              <p className="text-gray-400">No forecast available.</p>
            )}
          </div>

          {/* Zoom Earth preview link */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-3">🌍 Live Satellite View (Zoom Earth)</h2>
            <p className="text-gray-400 mb-4 text-sm">
              View real-time satellite imagery of clouds, storms, and weather patterns for the whole Philippines. 
              Click below to open Zoom Earth in a new tab.
            </p>
            <a
              href="https://zoom.earth/maps/satellite/#view=11.5,122.5,5z"
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition"
            >
              <img
                src="https://zoom.earth/assets/images/zoom-earth-social.jpg"
                alt="Zoom Earth Philippines Satellite"
                className="w-full h-auto object-cover"
              />
              <div className="bg-gray-900 text-center p-3 text-blue-400 font-semibold">
                🌍 Open Live Map on Zoom Earth ↗
              </div>
            </a>
          </div>

          <div className="page-bottom-spacer" />
        </div>
      </section>
    </>
  );
}

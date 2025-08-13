// src/pages/api/ph-alerts.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Alerts = {
  hasStormInPAR: boolean;
  stormName?: string;   // PAGASA name (e.g., EGAY)
  category?: string;    // Typhoon / STS / TS / TD …
  bulletinUrl?: string;

  hasLPA: boolean;
  lpaText?: string;     // small snippet mentioning LPA
  advisoryUrl?: string;

  fetchedAt: string;    // ISO
};

type StormDetect = {
  hasStormInPAR: boolean;
  stormName?: string;
  category?: string;
};

type LpaDetect = {
  hasLPA: boolean;
  lpaText?: string;
};

const STORM_URL =
  "https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";
const ADVISORY_URL =
  "https://bagong.pagasa.dost.gov.ph/weather/advisories";

// Small helper with timeout + UA (PAGASA sometimes blocks generic bots)
async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "PinoyTambayanHub/1.0 (+https://example.com)" },
    });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// Normalize whitespace to make regex matching easier
function squish(html: string) {
  return html.replace(/\s+/g, " ");
}

// ---------------- Storm detection ----------------
function detectStormInPAR(htmlRaw: string): StormDetect {
  const html = squish(htmlRaw);

  // Common PAGASA categories
  const CATS = [
    "Super Typhoon",
    "Typhoon",
    "Severe Tropical Storm",
    "Tropical Storm",
    "Tropical Depression",
  ];
  const catRegex = new RegExp(`\\b(${CATS.join("|")})\\b`, "i");

  // e.g. "Typhoon EGAY", "Tropical Depression AURING"
  const nameRegex =
    /\b(?:Super Typhoon|Typhoon|Severe Tropical Storm|Tropical Storm|Tropical Depression)\s+([A-Z][A-Za-z\-]*)\b/;

  // “PAR” mention (often appears as “Philippine Area of Responsibility (PAR)”)
  const mentionsPAR =
    /\bPhilippine\s+Area\s+of\s+Responsibility\b|\b\(PAR\)/i.test(html);

  const catMatch = html.match(catRegex);
  const nameMatch = html.match(nameRegex);

  if (catMatch && mentionsPAR) {
    return {
      hasStormInPAR: true,
      category: catMatch[1],
      stormName: nameMatch?.[1]?.toUpperCase(),
    };
  }

  // Fallback: a bulletin exists, but PAR not explicitly spelled on listing.
  if (catMatch && /\bBulletin\b/i.test(html)) {
    return {
      hasStormInPAR: false,
      category: catMatch[1],
      stormName: nameMatch?.[1]?.toUpperCase(),
    };
  }

  return { hasStormInPAR: false };
}

// ---------------- LPA detection ----------------
function detectLPA(htmlRaw: string): LpaDetect {
  const html = squish(htmlRaw);
  const lpaIdx = html.search(/Low\s*Pressure\s*Area/i);
  if (lpaIdx === -1) return { hasLPA: false };

  // Grab a small readable snippet around the first match
  const start = Math.max(0, lpaIdx - 140);
  const end = Math.min(html.length, lpaIdx + 220);
  const snippet = html.slice(start, end).replace(/\s+/g, " ").trim();

  return { hasLPA: true, lpaText: snippet };
}

// ---------------- API route ----------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Alerts | { error: string }>
) {
  try {
    // Cache for 10 minutes at the CDN / Vercel edge; allow stale for 30 min
    res.setHeader(
      "Cache-Control",
      "s-maxage=600, stale-while-revalidate=1800"
    );

    const [stormHtml, advHtml] = await Promise.all([
      fetchText(STORM_URL).catch(() => ""),
      fetchText(ADVISORY_URL).catch(() => ""),
    ]);

    const storm = stormHtml ? detectStormInPAR(stormHtml) : { hasStormInPAR: false };
    const lpa = advHtml ? detectLPA(advHtml) : { hasLPA: false };

    const payload: Alerts = {
      hasStormInPAR: !!storm.hasStormInPAR,
      stormName: storm.stormName,
      category: storm.category,
      bulletinUrl: STORM_URL,

      hasLPA: !!lpa.hasLPA,
      lpaText: lpa.lpaText,
      advisoryUrl: ADVISORY_URL,

      fetchedAt: new Date().toISOString(),
    };

    res.status(200).json(payload);
  } catch (err: any) {
    // Soft‑fail: return a valid shape so the UI still renders
    res.status(200).json({
      hasStormInPAR: false,
      hasLPA: false,
      fetchedAt: new Date().toISOString(),
    });
  }
}

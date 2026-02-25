// src/pages/api/ph-alerts.ts
import type { NextApiRequest, NextApiResponse } from "next";

export type Alerts = {
  hasStormInPAR: boolean;
  stormName?: string;   // PAGASA name (e.g., AGATON, EGAY)
  category?: string;    // Typhoon / Severe Tropical Storm, etc.
  bulletinUrl?: string;
  hasLPA: boolean;
  lpaText?: string;     // Context snippet for Low Pressure Area
  advisoryUrl?: string;
  fetchedAt: string;    // ISO Timestamp
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

const STORM_URL = "https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";
const ADVISORY_URL = "https://bagong.pagasa.dost.gov.ph/weather/advisories";

/* ===================== FETCH HELPER ===================== */
async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 
        "User-Agent": "PinoyTambayanHub/1.0 (+https://pinoy-tambayan-hub.vercel.app)" 
      },
    });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function squish(html: string) {
  return html.replace(/\s+/g, " ");
}

/* ===================== EXTRACTION UTILS ===================== */
const CAT_LIST = [
  "Super Typhoon",
  "Typhoon",
  "Severe Tropical Storm",
  "Tropical Storm",
  "Tropical Depression",
];

const catRegex = new RegExp(`\\b(${CAT_LIST.join("|")})\\b`, "i");

const nameAfterCatRegex =
  /\b(?:Super Typhoon|Typhoon|Severe Tropical Storm|Tropical Storm|Tropical Depression)\s+([A-ZÑ]{3,}(?:\s+[A-ZÑ]{2,})*)\b/;

const ogTitleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const titleTagRegex = /<title[^>]*>([^<]+)<\/title>/i;
const headingRegex = /<(?:h1|h2|h3)[^>]*>(.*?)<\/(?:h1|h2|h3)>/gi;

function normalizeName(raw?: string): string | undefined {
  if (!raw) return undefined;
  let n = raw
    .replace(/\(.*?\)/g, " ")      
    .replace(/[^\wÑ\s-]/gi, " ")   
    .replace(/\s+/g, " ")          
    .trim();

  if (/[a-z]/.test(n)) n = n.toUpperCase();
  
  // Guard: Avoid common false positives
  if (CAT_LIST.some((c) => new RegExp("^" + c + "$", "i").test(n))) return undefined;
  if (/BULLETIN|ADVISORY|SEVERE|TROPICAL|TYPHOON|DEPRESSION|STORM|WEATHER/i.test(n)) {
    return undefined;
  }
  if (n.split(" ").length > 3) return undefined;

  return n || undefined;
}

function extractName(html: string): string | undefined {
  // 1) Category + NAME pattern
  const m1 = html.match(nameAfterCatRegex);
  const n1 = normalizeName(m1?.[1]);
  if (n1) return n1;

  // 2) og:title metadata
  const m2 = html.match(ogTitleRegex);
  const n2 = normalizeName(m2?.[1]?.match(nameAfterCatRegex)?.[1] || m2?.[1]);
  if (n2) return n2;

  // 3) Standard title tag
  const m3 = html.match(titleTagRegex);
  const n3 = normalizeName(m3?.[1]?.match(nameAfterCatRegex)?.[1] || m3?.[1]);
  if (n3) return n3;

  // 4) Main headings
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(html))) {
    const text = squish(m[1]);
    const n = normalizeName(text.match(nameAfterCatRegex)?.[1] || text);
    if (n) return n;
  }

  return undefined;
}

function detectPARState(html: string) {
  const saysInside = /\b(?:inside|within|entered|inside\s+the)\b.*\b(?:PAR|Philippine\s+Area\s+of\s+Responsibility)\b/i.test(html);
  const saysOutside = /\b(?:outside|remains\s+outside|outside\s+the)\b.*\b(?:PAR|Philippine\s+Area\s+of\s+Responsibility)\b/i.test(html);

  if (saysInside) return true;
  if (saysOutside) return false;
  
  // Fallback: If "inside" isn't explicitly mentioned, but a storm name is active, 
  // PAGASA bulletins usually imply it is currently a threat to PAR.
  return /\b(?:PAR|Philippine\s+Area\s+of\s+Responsibility)\b/i.test(html);
}

/* ===================== DETECTION LOGIC ===================== */
function detectStormInPAR(htmlRaw: string): StormDetect {
  const html = squish(htmlRaw);
  const catMatch = html.match(catRegex);
  const stormName = extractName(html);
  const inPAR = detectPARState(html);

  if (catMatch || stormName) {
    return {
      hasStormInPAR: !!inPAR, 
      category: catMatch?.[1],
      stormName: stormName,
    };
  }
  return { hasStormInPAR: false };
}

function detectLPA(htmlRaw: string): LpaDetect {
  const html = squish(htmlRaw);
  const lpaIdx = html.search(/Low\s*Pressure\s*Area/i);
  if (lpaIdx === -1) return { hasLPA: false };

  const start = Math.max(0, lpaIdx - 140);
  const end = Math.min(html.length, lpaIdx + 220);
  const snippet = html.slice(start, end).replace(/\s+/g, " ").trim();

  return { hasLPA: true, lpaText: snippet };
}

/* ===================== API HANDLER ===================== */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Alerts | { error: string }>
) {
  try {
    // Shared Edge Cache: 10 mins fresh, 30 mins stale
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");

    const [stormHtml, advHtml] = await Promise.all([
      fetchText(STORM_URL).catch(() => ""),
      fetchText(ADVISORY_URL).catch(() => ""),
    ]);

    const storm = stormHtml ? detectStormInPAR(stormHtml) : { hasStormInPAR: false };
    const lpa = advHtml ? detectLPA(advHtml) : { hasLPA: false };

    res.status(200).json({
      hasStormInPAR: !!storm.hasStormInPAR,
      stormName: storm.stormName,
      category: storm.category,
      bulletinUrl: STORM_URL,

      hasLPA: !!lpa.hasLPA,
      lpaText: lpa.lpaText,
      advisoryUrl: ADVISORY_URL,

      fetchedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    // Standard fail-safe: return empty alerts instead of a 500 error
    res.status(200).json({
      hasStormInPAR: false,
      hasLPA: false,
      fetchedAt: new Date().toISOString(),
    });
  }
}
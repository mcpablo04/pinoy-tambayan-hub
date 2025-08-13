// src/pages/api/ph-alerts.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Alerts = {
  hasStormInPAR: boolean;
  stormName?: string;   // PAGASA name (e.g., EGAY)
  category?: string;    // Typhoon / Severe Tropical Storm / Tropical Storm / Tropical Depression
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

const STORM_URL = "https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";
const ADVISORY_URL = "https://bagong.pagasa.dost.gov.ph/weather/advisories";

// ------------ fetch helper ------------
async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "PinoyTambayanHub/1.0 (+https://pinoy-tambayan.example)" },
    });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function squish(html: string) {
  return html.replace(/\s+/g, " ");
}

// ------------ extraction utils ------------
const CAT_LIST = [
  "Super Typhoon",
  "Typhoon",
  "Severe Tropical Storm",
  "Tropical Storm",
  "Tropical Depression",
];

const catRegex = new RegExp(`\\b(${CAT_LIST.join("|")})\\b`, "i");

/**
 * Name patterns to catch variants like:
 *   - TYPHOON EGAY
 *   - SEVERE TROPICAL STORM GORING
 *   - TROPICAL DEPRESSION AMANG (formerly something)
 *   - Typhoon EGAY (INTERNATIONAL NAME: DOKSURI)
 * This allows ALL CAPS names (A–Z, Ñ), and possible multi-word names.
 */
const nameAfterCatRegex =
  /\b(?:Super Typhoon|Typhoon|Severe Tropical Storm|Tropical Storm|Tropical Depression)\s+([A-ZÑ]{3,}(?:\s+[A-ZÑ]{2,})*)\b/;

/** Try to read name from <title> or og:title too. */
const ogTitleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const titleTagRegex = /<title[^>]*>([^<]+)<\/title>/i;
/** Headings occasionally include the formatted “Typhoon EGAY” text */
const headingRegex = /<(?:h1|h2|h3)[^>]*>(.*?)<\/(?:h1|h2|h3)>/gi;

/** Clean up extracted name: strip trailing punctuation, parenthetical notes, keep CAPS. */
function normalizeName(raw?: string): string | undefined {
  if (!raw) return undefined;
  let n = raw
    .replace(/\(.*?\)/g, " ")       // remove parenthetical notes
    .replace(/[^\wÑ\s-]/gi, " ")    // strip punctuation (keep dash)
    .replace(/\s+/g, " ")           // dedupe spaces
    .trim();

  // If name is mixed case (e.g., "Egay"), uppercase it for consistency
  if (/[a-z]/.test(n)) n = n.toUpperCase();
  // Avoid capturing the category words themselves as name
  if (CAT_LIST.some((c) => new RegExp("^" + c + "$", "i").test(n))) return undefined;
  // Don’t return obviously generic words
  if (/BULLETIN|ADVISORY|SEVERE|TROPICAL|TYPHOON|DEPRESSION|STORM/i.test(n)) {
    // likely not a pure name
    return undefined;
  }
  // If name contains spaces and is too long, bail
  if (n.split(" ").length > 3) return undefined;

  return n || undefined;
}

/** Extract the most likely storm name from various places */
function extractName(html: string): string | undefined {
  // 1) Category + NAME pattern
  const m1 = html.match(nameAfterCatRegex);
  const n1 = normalizeName(m1?.[1]);
  if (n1) return n1;

  // 2) og:title
  const m2 = html.match(ogTitleRegex);
  const n2 = normalizeName(m2?.[1]?.match(nameAfterCatRegex)?.[1] || m2?.[1]);
  if (n2) return n2;

  // 3) <title>
  const m3 = html.match(titleTagRegex);
  const n3 = normalizeName(m3?.[1]?.match(nameAfterCatRegex)?.[1] || m3?.[1]);
  if (n3) return n3;

  // 4) Headings
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(html))) {
    const text = squish(m[1]);
    const n = normalizeName(text.match(nameAfterCatRegex)?.[1] || text);
    if (n) return n;
  }

  return undefined;
}

/** Determine if text says inside/within/outside PAR */
function detectPARState(html: string) {
  const hasPARWord = /\b(?:Philippine\s+Area\s+of\s+Responsibility|PAR)\b/i.test(html);
  const saysInside = /\b(?:inside|within|entered|inside\s+the)\b.*\b(?:PAR)\b/i.test(html);
  const saysOutside = /\b(?:outside|remains\s+outside|outside\s+the)\b.*\b(?:PAR)\b/i.test(html);

  let inPAR = false;
  if (saysInside) inPAR = true;
  else if (saysOutside) inPAR = false;
  else if (hasPARWord) {
    // If only PAR is mentioned without clarity, keep as “unknown” (false) and let UI link to bulletin.
    inPAR = false;
  }
  return inPAR;
}

// ------------ Storm detection ------------
function detectStormInPAR(htmlRaw: string): StormDetect {
  const html = squish(htmlRaw);

  const catMatch = html.match(catRegex);
  const stormName = extractName(html);
  const inPAR = detectPARState(html);

  if (catMatch || stormName) {
    return {
      hasStormInPAR: !!inPAR, // only true if text suggests inside/within PAR
      category: catMatch?.[1],
      stormName: stormName,
    };
  }

  return { hasStormInPAR: false };
}

// ------------ LPA detection ------------
function detectLPA(htmlRaw: string): LpaDetect {
  const html = squish(htmlRaw);
  const lpaIdx = html.search(/Low\s*Pressure\s*Area/i);
  if (lpaIdx === -1) return { hasLPA: false };

  const start = Math.max(0, lpaIdx - 140);
  const end = Math.min(html.length, lpaIdx + 220);
  const snippet = html.slice(start, end).replace(/\s+/g, " ").trim();

  return { hasLPA: true, lpaText: snippet };
}

// ------------ API route ------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Alerts | { error: string }>
) {
  try {
    // Cache at the edge for 10 minutes, allow stale for 30 min
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
    // Soft‑fail so the UI still renders
    res.status(200).json({
      hasStormInPAR: false,
      hasLPA: false,
      fetchedAt: new Date().toISOString(),
    });
  }
}

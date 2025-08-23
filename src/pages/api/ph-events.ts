// src/pages/api/ph-events.ts
import type { NextApiRequest, NextApiResponse } from "next";

const TM = process.env.TICKETMASTER_KEY!;
if (!TM) console.warn("Missing TICKETMASTER_KEY in env");

type TMEvent = {
  id: string;
  name: string;
  url: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  _embedded?: { venues?: { name?: string; city?: { name?: string } }[] };
};

async function fetchPage(params: URLSearchParams, page = 0) {
  params.set("page", String(page)); // 0‑based
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Ticketmaster ${r.status}`);
  return r.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!TM) return res.status(500).json({ error: "Server missing TICKETMASTER_KEY" });

    const city = (req.query.city as string | undefined)?.trim();
    const keyword = (req.query.q as string | undefined)?.trim();

    const params = new URLSearchParams({
      apikey: TM,
      countryCode: "PH",            // 🇵🇭 only
      classificationName: "music",  // concerts/gigs/festivals
      sort: "date,asc",
      size: "100",                  // max per page
    });
    if (city) params.set("city", city);
    if (keyword) params.set("keyword", keyword);

    // First page
    const first = await fetchPage(params, 0);
    const events: TMEvent[] = first?._embedded?.events ?? [];
    const totalPages: number = Math.min(first?.page?.totalPages ?? 1, 5); // safety cap

    // Remaining pages in parallel
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(params, i + 1))
    );
    for (const r of rest) events.push(...(r?._embedded?.events ?? []));

    // Normalize
    const out = events.map((ev) => ({
      id: ev.id,
      name: ev.name,
      url: ev.url,
      date: ev.dates?.start?.localDate ?? null,
      time: ev.dates?.start?.localTime ?? null,
      venue: ev._embedded?.venues?.[0]?.name ?? "",
      city: ev._embedded?.venues?.[0]?.city?.name ?? "",
    }));

    out.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    res.status(200).json({ count: out.length, events: out });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to fetch events" });
  }
}

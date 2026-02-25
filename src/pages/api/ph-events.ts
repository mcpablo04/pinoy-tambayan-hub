import type { NextApiRequest, NextApiResponse } from "next";

const TM = process.env.TICKETMASTER_KEY;

type TMEvent = {
  id: string;
  name: string;
  url: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  _embedded?: { venues?: { name?: string; city?: { name?: string } }[] };
};

/* ===================== FETCH HELPER ===================== */
async function fetchPage(params: URLSearchParams, page = 0) {
  params.set("page", String(page));
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
  
  const r = await fetch(url);
  if (r.status === 429) throw new Error("Ticketmaster rate limit exceeded. Try again in a minute.");
  if (!r.ok) throw new Error(`Ticketmaster API error: ${r.status}`);
  
  return r.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!TM) {
      console.error("Missing TICKETMASTER_KEY");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const city = (req.query.city as string | undefined)?.trim();
    const keyword = (req.query.q as string | undefined)?.trim();

    const params = new URLSearchParams({
      apikey: TM,
      countryCode: "PH",
      classificationName: "music",
      sort: "date,asc",
      size: "20", // 20 is a safer default for performance
    });

    if (city) params.set("city", city);
    if (keyword) params.set("keyword", keyword);

    // Fetch first page to see how many total pages exist
    const first = await fetchPage(params, 0);
    const events: TMEvent[] = first?._embedded?.events ?? [];

    // TICKETMASTER RATE LIMIT PRO-TIP: 
    // Don't fetch too many pages in parallel on a Free Tier key. 
    // Usually, 1-2 pages (40 events) is plenty for a "Upcoming Gigs" section.
    const totalPagesAvailable = first?.page?.totalPages ?? 1;
    const pagesToFetch = Math.min(totalPagesAvailable, 2); 

    if (pagesToFetch > 1) {
      const rest = await Promise.all(
        Array.from({ length: pagesToFetch - 1 }, (_, i) => fetchPage(params, i + 1))
      );
      for (const r of rest) {
        if (r?._embedded?.events) events.push(...r._embedded.events);
      }
    }

    // Normalize and clean up for your UI
    const out = events.map((ev) => {
      const date = ev.dates?.start?.localDate;
      // Convert YYYY-MM-DD to a more readable Pinoy format like "Oct 24, 2026"
      const formattedDate = date 
        ? new Date(date).toLocaleDateString("en-PH", { 
            month: "short", 
            day: "numeric", 
            year: "numeric" 
          }) 
        : "TBA";

      return {
        id: ev.id,
        name: ev.name,
        url: ev.url,
        originalDate: date ?? null,
        displayDate: formattedDate,
        time: ev.dates?.start?.localTime ?? null,
        venue: ev._embedded?.venues?.[0]?.name ?? "TBA",
        city: ev._embedded?.venues?.[0]?.city?.name ?? "Philippines",
      };
    });

    // Final Sort by date
    out.sort((a, b) => (a.originalDate || "").localeCompare(b.originalDate || ""));

    // Cache at the edge for 1 hour (Concert dates don't change that often!)
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");
    
    return res.status(200).json({ count: out.length, events: out });
  } catch (e: any) {
    console.error("PH-Events Error:", e.message);
    return res.status(500).json({ error: e?.message || "Failed to fetch events" });
  }
}
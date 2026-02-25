import type { NextApiRequest, NextApiResponse } from "next";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Better default query to catch local PH Entertainment & News
    const defaultQuery = 'OPM OR "Original Pilipino Music" OR "Philippine Entertainment"';
    const q = (req.query.q as string)?.trim() || defaultQuery;
    
    const url = `https://news.google.com/rss/search?hl=en-PH&gl=PH&ceid=PH:en&q=${encodeURIComponent(q)}`;

    const r = await fetch(url, { 
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 600 } // Next.js level caching (optional)
    });

    if (!r.ok) {
      return res.status(502).json({ error: "Failed to fetch Google News" });
    }

    const xml = await r.text();
    const data = parser.parse(xml);

    // Google News RSS path: rss -> channel -> item
    const rawItems = data?.rss?.channel?.item;
    const itemsArray = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const items = itemsArray.slice(0, 10).map((it: any) => {
      const fullTitle: string = it?.title ?? "";
      const source: string = it?.source?.["#text"] ?? it?.source ?? "News";
      
      // Clean up title: Removes the " - Source Name" from the end
      const cleanTitle = fullTitle.replace(` - ${source}`, "").trim();

      return {
        title: cleanTitle,
        link: it?.link ?? "",
        pubDate: it?.pubDate ?? "",
        source: source,
      };
    });

    // Cache on Vercel's Edge for 10 mins (s-maxage) 
    // and serve stale content for 5 mins while revalidating
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");
    
    return res.status(200).json({ items });
  } catch (e: any) {
    console.error("News API Error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
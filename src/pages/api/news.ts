// src/pages/api/news.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = (req.query.q as string)?.trim() || 'OPM OR "Original Pilipino Music" OR "Philippine music"';
    // PH-localized Google News RSS
    const url = `https://news.google.com/rss/search?hl=en-PH&gl=PH&ceid=PH:en&q=${encodeURIComponent(q)}`;

    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) {
      return res.status(502).json({ error: "Upstream error", status: r.status });
    }

    const xml = await r.text();
    const data = parser.parse(xml);

    const items = (data?.rss?.channel?.item || []).map((it: any) => {
      // Google News puts source inside <source>, and original link inside link
      const title: string = it?.title ?? "";
      const link: string = it?.link ?? "";
      const pubDate: string = it?.pubDate ?? "";
      const source: string = it?.source?.["#text"] ?? "";
      // Optional: some feeds add media:content; keep simple here
      return { title, link, pubDate, source };
    });

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");
    return res.status(200).json({ items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}

"use client";

import Link from "next/link";

export const CAT_LABELS: Record<string, string> = {
  general: "General",
  mobile: "Mobile",
  web: "Web",
  media: "Media",
  tech: "Tech",
  gaming: "Gaming",
  lounge: "Lounge",
};

export default function CategoryPill({ cat }: { cat?: string }) {
  if (!cat || !CAT_LABELS[cat]) return null;
  return (
    <Link
      href={{ pathname: "/forums", query: { cat } }}
      className="px-2 py-0.5 rounded-full text-[11px] bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700/60"
      aria-label={`View ${CAT_LABELS[cat]} threads`}
      title={CAT_LABELS[cat]}
    >
      #{CAT_LABELS[cat]}
    </Link>
  );
}

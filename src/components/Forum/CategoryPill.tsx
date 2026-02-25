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
      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all duration-200"
      aria-label={`View ${CAT_LABELS[cat]} threads`}
    >
      <span className="opacity-50 mr-1">#</span>
      {CAT_LABELS[cat]}
    </Link>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/router";

const CATS: { id?: string; label: string; href: string; emoji: string }[] = [
  { label: "All", href: "/forums", emoji: "🧭" },
  { label: "General Discussions", href: "/forums?cat=general", emoji: "💬" },
  { label: "Mobile Networks", href: "/forums?cat=mobile", emoji: "📶" },
  { label: "Web · Internet", href: "/forums?cat=web", emoji: "🕸️" },
  { label: "Streaming · Media", href: "/forums?cat=media", emoji: "🎬" },
  { label: "Technology · Computing", href: "/forums?cat=tech", emoji: "🖥️" },
  { label: "Gaming Hub", href: "/forums?cat=gaming", emoji: "🎮" },
  { label: "Community Lounge", href: "/forums?cat=lounge", emoji: "🧉" },
];

export default function Sidebar() {
  const router = useRouter();
  const active = (router.query.cat as string) || "all";

  return (
    <aside className="rounded-2xl bg-[#121722] border border-gray-800">
      <div className="px-3 py-2 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
        Sections
      </div>
      <ul className="p-2">
        {CATS.map((c) => {
          const currentId = c.href.includes("?cat=") ? c.href.split("?cat=")[1] : "all";
          const isActive = currentId === active;

          return (
            <li key={c.href}>
              <Link
                href={c.href}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm ${
                  isActive
                    ? "bg-blue-600/20 border border-blue-700 text-blue-200"
                    : "text-gray-200 hover:bg-gray-800/60 border border-transparent"
                }`}
              >
                <span className="text-lg leading-none">{c.emoji}</span>
                <span>{c.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

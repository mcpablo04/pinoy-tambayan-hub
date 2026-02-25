"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { 
  LayoutGrid, 
  MessageSquare, 
  Smartphone, 
  Globe, 
  PlayCircle, 
  Cpu, 
  Gamepad2, 
  Coffee,
  Home
} from "lucide-react";

const CATS = [
  { id: "all", label: "All Discussions", href: "/forums", icon: LayoutGrid },
  { id: "general", label: "General", href: "/forums?cat=general", icon: MessageSquare },
  { id: "mobile", label: "Mobile Networks", href: "/forums?cat=mobile", icon: Smartphone },
  { id: "web", label: "Web · Internet", href: "/forums?cat=web", icon: Globe },
  { id: "media", label: "Streaming · Media", href: "/forums?cat=media", icon: PlayCircle },
  { id: "tech", label: "Tech · Computing", href: "/forums?cat=tech", icon: Cpu },
  { id: "gaming", label: "Gaming Hub", href: "/forums?cat=gaming", icon: Gamepad2 },
  { id: "lounge", label: "Community Lounge", href: "/forums?cat=lounge", icon: Coffee },
];

export default function Sidebar() {
  const router = useRouter();
  const active = (router.query.cat as string) || "all";

  return (
    <nav className="flex flex-col gap-6">
      {/* Quick Links Section */}
      <div>
        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Menu
        </div>
        <ul className="mt-1 space-y-1">
          <li>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
            >
              <Home size={18} className="text-gray-500" />
              <span>Portal Home</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Forum Sections */}
      <div className="bg-[#121722] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Forum Sections
        </div>
        <ul className="p-2 space-y-1">
          {CATS.map((c) => {
            const isActive = active === c.id;
            const Icon = c.icon;

            return (
              <li key={c.id}>
                <Link
                  href={c.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/80"
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`${isActive ? "text-white" : "text-gray-600 group-hover:text-blue-400"} transition-colors`} 
                  />
                  <span className={isActive ? "font-bold" : "font-medium"}>
                    {c.label}
                  </span>
                  
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stats or Meta info could go here later */}
    </nav>
  );
}
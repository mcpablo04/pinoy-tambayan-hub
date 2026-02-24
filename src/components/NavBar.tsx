"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  LogOut, User, Settings, ChevronDown, CloudSun, LayoutGrid,
  Radio, Newspaper, ShoppingBag, History, MessagesSquare,
  CalendarDays, Wrench, Languages, Calculator, Thermometer
} from "lucide-react";

export default function Navbar() {
  const { profile, signOutApp, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setToolsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // FULL FEATURE LIST - Re-included News with 7 total links
  const navLinks = [
    { name: "Home", href: "/", icon: <LayoutGrid size={14} /> },
    { name: "Radio", href: "/radio", icon: <Radio size={14} /> },
    { name: "News", href: "/news", icon: <Newspaper size={14} className="text-emerald-400" /> },
    { name: "Forums", href: "/forums", icon: <MessagesSquare size={14} /> },
    { name: "Market", href: "/marketplace", icon: <ShoppingBag size={14} /> },
    { name: "Stories", href: "/stories", icon: <History size={14} /> },
    { name: "Events", href: "/events", icon: <CalendarDays size={14} /> },
  ];

  const quickTools = [
    { name: "Weather", href: "/tools/weather", icon: <Thermometer size={14} />, desc: "PH Local Forecast" },
    { name: "Forex", href: "/tools/forex", icon: <Calculator size={14} />, desc: "PHP Exchange Rates" },
    { name: "Translate", href: "/tools/translate", icon: <Languages size={14} />, desc: "English to Tagalog" },
  ];

  return (
    <nav className={`fixed top-0 z-[100] w-full transition-all duration-500 ${
      scrolled ? "bg-[#020617]/95 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl" : "bg-transparent py-6"
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          
          {/* BRAND */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center font-black text-white shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform">PT</div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white italic uppercase">Pinoy <span className="text-blue-500">Tambayan</span></span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Community Hub</span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`px-3 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group ${
                    isActive ? "text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.name === "News" ? (
                    <div className="relative">
                      {link.icon}
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                  ) : link.icon}
                  {link.name}
                </Link>
              );
            })}

            {/* TOOLS DROPDOWN */}
            <div className="relative ml-2">
              <button 
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5 ${toolsOpen ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"}`}
              >
                <Wrench size={14} /> Tools <ChevronDown size={12} className={`transition-transform duration-300 ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setToolsOpen(false)} />
                  <div className="absolute right-0 mt-3 w-64 bg-[#0f172a] border border-white/10 rounded-[2rem] shadow-2xl z-20 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">Utility Tools</div>
                    {quickTools.map((tool) => (
                      <Link key={tool.name} href={tool.href} className="flex items-center gap-4 px-3 py-3 hover:bg-white/5 rounded-2xl transition-all group">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {tool.icon}
                        </div>
                        <div>
                          <p className="text-white text-[11px] font-black uppercase tracking-wider">{tool.name}</p>
                          <p className="text-slate-500 text-[9px] font-medium">{tool.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* USER ACTIONS */}
          <div className="hidden md:flex items-center gap-3">
             {loading ? (
                <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
             ) : profile ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 pr-3 rounded-full hover:bg-white/10 transition-all">
                    <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-3 w-56 bg-[#0f172a] border border-white/10 rounded-[2rem] shadow-2xl z-20 p-2 animate-in fade-in zoom-in-95 duration-200">
                         <div className="p-4 border-b border-white/5 mb-1">
                            <p className="text-white text-xs font-black truncate uppercase tracking-tight">{profile.displayName}</p>
                            <p className="text-slate-500 text-[9px] truncate font-medium">{profile.email}</p>
                         </div>
                         <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                            <User size={14} /> Profile
                         </Link>
                         <button onClick={() => signOutApp()} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                            <LogOut size={14} /> Sign Out
                         </button>
                      </div>
                    </>
                  )}
                </div>
             ) : (
                <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95">Sign In</Link>
             )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="xl:hidden flex items-center gap-3">
            <button onClick={() => setIsOpen(!isOpen)} className="w-11 h-11 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-transform">
               <div className="w-5 h-4 relative flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? "opacity-0" : ""}`} />
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      <div className={`xl:hidden fixed inset-x-0 top-[73px] transition-all duration-500 bg-[#020617] border-b border-white/10 overflow-y-auto ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 py-10 space-y-8">
          <div className="grid grid-cols-1 gap-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-5 text-3xl font-black uppercase tracking-tighter text-slate-500 hover:text-blue-500 transition-colors">
                <span className="p-3 bg-white/5 rounded-2xl text-blue-600">{link.icon}</span> {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
            {quickTools.map((tool) => (
              <Link key={tool.name} href={tool.href} className="bg-white/5 p-5 rounded-[2rem] flex flex-col gap-4 border border-white/5 active:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">{tool.icon}</div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white">{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  LogOut, User, ChevronDown, LayoutGrid,
  Radio, Newspaper, ShoppingBag, History, MessagesSquare,
  CalendarDays, Wrench, Languages, Calculator, Thermometer,
  Search, Bell
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
      scrolled 
        ? "bg-[#020617]/80 backdrop-blur-2xl border-b border-white/10 py-3 shadow-2xl" 
        : "bg-transparent py-6"
    }`}>
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex justify-between items-center">
          
          {/* BRAND */}
          <Link href="/" className="flex items-center gap-4 shrink-0 group">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-black text-white shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-all duration-300">
              PT
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white italic uppercase leading-none">
                Pinoy <span className="text-blue-500">Tambayan</span>
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Community Hub</span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden xl:flex items-center space-x-1 bg-white/[0.03] border border-white/5 p-1 rounded-full backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group ${
                    isActive ? "text-white bg-blue-600 shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"}>
                    {link.icon}
                  </span>
                  {link.name}
                  {link.name === "News" && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button className="hidden md:flex w-10 h-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Search size={18} />
            </button>

            {/* TOOLS DROPDOWN */}
            <div className="relative hidden lg:block">
              <button 
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border border-white/10 ${toolsOpen ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
              >
                <Wrench size={18} />
              </button>

              {toolsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setToolsOpen(false)} />
                  <div className="absolute right-0 mt-4 w-72 bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl z-20 p-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-2">System Utilities</div>
                    <div className="grid gap-1">
                      {quickTools.map((tool) => (
                        <Link key={tool.name} href={tool.href} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-[1.5rem] transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {tool.icon}
                          </div>
                          <div>
                            <p className="text-white text-xs font-black uppercase tracking-wider">{tool.name}</p>
                            <p className="text-slate-500 text-[9px] font-medium leading-none mt-1">{tool.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

            {/* AUTH SECTION */}
            {loading ? (
              <div className="w-10 h-10 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            ) : profile ? (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)} 
                  className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <img src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} className="w-9 h-9 rounded-[14px] object-cover border border-white/10 shadow-lg" alt="" />
                  <ChevronDown size={14} className={`text-slate-500 mr-2 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-4 w-64 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl z-20 p-3 animate-in zoom-in-95 duration-200">
                       <div className="p-5 border-b border-white/5 mb-2">
                          <p className="text-white text-[13px] font-black truncate uppercase tracking-tight">{profile.displayName}</p>
                          <p className="text-slate-500 text-[10px] truncate font-medium mt-1">{profile.email}</p>
                       </div>
                       <div className="grid gap-1">
                        <Link href="/profile" className="flex items-center gap-3 px-5 py-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest">
                          <User size={16} /> Profile Settings
                        </Link>
                        <button onClick={() => signOutApp()} className="w-full flex items-center gap-3 px-5 py-3.5 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest">
                          <LogOut size={16} /> End Session
                        </button>
                       </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                Join Now
              </Link>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button onClick={() => setIsOpen(!isOpen)} className="xl:hidden w-11 h-11 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? "opacity-0" : ""}`} />
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FULLSCREEN OVERLAY */}
      <div className={`xl:hidden fixed inset-0 top-0 z-[-1] transition-all duration-700 bg-[#020617] ${isOpen ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="h-full flex flex-col pt-32 px-8 pb-10 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {navLinks.map((link, i) => (
              <Link 
                key={link.name} 
                href={link.href} 
                style={{ transitionDelay: `${i * 50}ms` }}
                className={`flex items-center justify-between p-6 rounded-[2rem] border border-white/5 transition-all ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
              >
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 flex items-center justify-center bg-blue-600/10 text-blue-500 rounded-2xl">{link.icon}</span>
                  <span className="text-2xl font-black uppercase tracking-tighter text-white">{link.name}</span>
                </div>
                <ChevronDown size={20} className="-rotate-90 text-slate-700" />
              </Link>
            ))}
          </div>
          
          <div className="mt-auto grid grid-cols-2 gap-4 pt-10 border-t border-white/10">
            {quickTools.slice(0, 2).map((tool) => (
              <Link key={tool.name} href={tool.href} className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <div className="text-blue-500 mb-3">{tool.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
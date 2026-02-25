"use client";

import Link from "next/link";
import { Facebook, ShieldCheck, HelpCircle, Mail, Info, ChevronUp } from "lucide-react";

// Modern X (Twitter) icon replacement
const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const links = [
    { name: "About", href: "/about", icon: Info },
    { name: "Terms", href: "/terms", icon: ShieldCheck },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Privacy", href: "/privacy", icon: ShieldCheck },
    { name: "Support", href: "/support", icon: HelpCircle },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/5 bg-[#020617]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
               <span className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Pinoy<span className="text-blue-500">Tambayan</span>
              </span>
              <div className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
                Hub
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.25em]">
              © {year} Premium Community Experience
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="group flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-all"
              >
                <link.icon size={14} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Social Presence */}
          <div className="flex items-center gap-5">
            <button 
              onClick={scrollToTop}
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all mr-4"
              title="Back to Top"
            >
              <ChevronUp size={20} />
            </button>
            
            <div className="h-8 w-px bg-white/5 hidden md:block" />

            <a
              href="https://facebook.com/..."
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#1877F2] hover:text-white hover:-translate-y-1.5 transition-all duration-300 shadow-xl"
            >
              <Facebook size={20} fill="currentColor" />
            </a>

            <a
              href="https://x.com/..."
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white hover:-translate-y-1.5 transition-all duration-300 shadow-xl"
            >
              <XIcon size={18} />
            </a>
          </div>
        </div>

        {/* Bottom Disclaimer/Meta */}
        <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center gap-6">
          <p className="text-[9px] text-center text-slate-600 max-w-3xl leading-relaxed uppercase font-bold tracking-[0.15em] opacity-80">
            Pinoy Tambayan Hub is an independent community project. We operate under fair use guidelines. 
            Content shared by users remains the property of their respective owners.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-6 text-[8px] font-black text-slate-700 tracking-[0.35em] uppercase">
            <div className="flex items-center gap-2 bg-white/[0.02] px-3 py-1 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Network: Global-IX</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.02] px-3 py-1 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Server: MNL-V3</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.02] px-3 py-1 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span>Latency: 24ms</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
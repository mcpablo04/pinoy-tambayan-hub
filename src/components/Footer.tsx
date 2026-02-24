// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { Facebook, Twitter, ShieldCheck, HelpCircle, Mail, Info } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const links = [
    { name: "About", href: "/about", icon: Info },
    { name: "Terms", href: "/terms", icon: ShieldCheck },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Privacy", href: "/privacy", icon: ShieldCheck },
    { name: "Support", href: "/support", icon: HelpCircle },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/5 bg-[#020617]">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
               <span className="text-xl font-black italic uppercase tracking-tighter text-white">
                Pinoy<span className="text-blue-500">Tambayan</span>
              </span>
              <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest text-blue-500">
                Hub
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              © {year} All Rights Reserved
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-white transition-colors"
              >
                <link.icon size={12} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Social Presence */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic mr-2">Connect</span>
            
            <a
              href="https://facebook.com/..."
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all duration-300"
            >
              <Facebook size={18} fill="currentColor" />
            </a>

            <a
              href="https://x.com/..."
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-400 hover:text-white hover:-translate-y-1 transition-all duration-300"
            >
              <Twitter size={18} fill="currentColor" />
            </a>
          </div>
        </div>

        {/* Bottom Disclaimer/Meta */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-[9px] text-center text-slate-600 max-w-2xl leading-relaxed uppercase font-bold tracking-widest">
            Pinoy Tambayan Hub is a community-driven platform. We do not host videos on our servers. 
            All content is provided by non-affiliated third parties.
          </p>
          <div className="flex items-center gap-4 text-[8px] font-black text-slate-700 tracking-[0.3em] uppercase">
            <span>Server: PH-MNL-01</span>
            <span className="w-1 h-1 rounded-full bg-slate-800" />
            <span>Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
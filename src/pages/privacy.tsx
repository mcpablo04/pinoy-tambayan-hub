"use client";

import Link from "next/link";
import Head from "next/head";
import { 
  ShieldCheck, 
  Eye, 
  Database, 
  Cookie, 
  UserCheck, 
  MessageSquare, 
  ArrowRight, 
  ExternalLink 
} from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "March 2025";

  return (
    <>
      <Head>
        <title>Privacy Policy | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Your privacy is our priority. Learn how Pinoy Tambayan Hub securely handles your OPM community data."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="min-h-screen bg-[#020617] selection:bg-blue-500/30">
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

          <div className="max-w-3xl mx-auto px-4 relative z-10">
            {/* 🛡️ HEADER */}
            <header className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-500 mb-2 border border-blue-500/20 shadow-inner">
                <ShieldCheck size={40} strokeWidth={1.5} />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
                Privacy <span className="text-blue-500">Policy</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-500 font-black tracking-[0.3em] uppercase text-[10px]">
                <span className="w-8 h-[1px] bg-slate-800" />
                <span>Last updated: <span className="text-blue-400">{lastUpdated}</span></span>
                <span className="w-8 h-[1px] bg-slate-800" />
              </div>
            </header>

            <div className="grid gap-6">
              {/* INTRO */}
              <article className="p-8 md:p-10 rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 leading-relaxed text-slate-300 shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] pointer-events-none" />
                <p className="relative z-10 text-lg font-medium italic">
                  "At <span className="text-white font-bold">Pinoy Tambayan Hub</span>, we believe your data belongs to you. Our mission is to provide a safe, transparent space for the OPM community."
                </p>
              </article>

              {/* WHAT WE COLLECT */}
              <section className="p-8 rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 shadow-xl group">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                    <Database size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Information We Collect</h2>
                </div>
                <ul className="space-y-5">
                  {[
                    { label: "Account Data", desc: "Email, display name, and profile settings for your hub identity." },
                    { label: "Community Content", desc: "Your stories, shared music reactions, and chat messages." },
                    { label: "Technical Metrics", desc: "Anonymized device info and page visits to optimize speed." },
                    { label: "Location Services", desc: "Optional GPS data for local weather features, only with your consent." },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-5 items-start">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0" />
                      <div>
                        <p className="text-white font-black uppercase text-xs tracking-widest mb-1">{item.label}</p>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* HOW WE USE IT */}
              <section className="p-8 rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Eye size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Data Utilization</h2>
                </div>
                <div className="grid gap-4">
                  {[
                    { text: "Powering the ", highlight: "Radio Player", extra: " and interactive community tools." },
                    { text: "Maintaining a ", highlight: "Safe Environment", extra: " through automated moderation." },
                    { text: "Performing ", highlight: "Site Analytics", extra: " to see which OPM features you enjoy most." },
                  ].map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-sm text-slate-400 flex gap-4 items-center">
                      <div className="w-1 h-8 bg-emerald-500/20 rounded-full" />
                      <p>
                        {item.text}<span className="text-white font-bold">{item.highlight}</span>{item.extra}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* COOKIES & ADS */}
              <section className="p-8 rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                    <Cookie size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Cookies & Partners</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  We use essential cookies to keep you signed in. Third-party partners like <strong>Google AdSense</strong> may use cookies to serve relevant ads based on your interests.
                </p>
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500 hover:text-black transition-all group"
                >
                  Google Ads Policy <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </section>

              {/* YOUR CHOICES */}
              <section className="p-8 rounded-[2.5rem] bg-[#0a0f1d] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                    <UserCheck size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Your Data Rights</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  You have the right to access, update, or request the deletion of your personal data at any time.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/account" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white hover:bg-blue-600 hover:border-blue-500 transition-all">
                    Update Profile <ArrowRight size={14} />
                  </Link>
                  <Link href="/contact" className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/20 transition-all">
                    Request Deletion
                  </Link>
                </div>
              </section>

              {/* CONTACT FOOTER */}
              <section className="p-10 md:p-12 rounded-[3rem] bg-blue-600 text-white shadow-2xl shadow-blue-600/30 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                   <ShieldCheck size={180} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-md">
                      <MessageSquare size={32} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black uppercase italic mb-3">Privacy Questions?</h2>
                  <p className="text-blue-100 font-medium mb-8 max-w-sm mx-auto">
                    Our data protection team is here to help you understand your rights.
                  </p>
                  <Link href="/contact" className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-50 shadow-xl active:scale-95 transition-all">
                    Get in Touch <ArrowRight size={16} />
                  </Link>
                </div>
              </section>
            </div>

            <footer className="mt-20 text-center">
              <Link href="/" className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-[0.4em] transition-colors">
                ← Back to Tambayan Hub
              </Link>
            </footer>
          </div>
        </section>
      </div>
    </>
  );
}
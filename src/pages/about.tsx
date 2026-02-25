"use client";

import Head from "next/head";
import Link from "next/link";
import { Radio, Heart, Zap, MessageSquare, ArrowRight, ShieldCheck, Globe } from "lucide-react";

const SITE_URL = "https://pinoytambayanhub.com"; 

export default function AboutPage() {
  const canonical = `${SITE_URL}/about`;
  const metaTitle = "About Us • Pinoy Tambayan Hub";
  const metaDesc = "Your digital home for OPM radio, PH news, and community stories. Built for Filipinos, by Filipinos — from Manila to the world.";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        {/* OpenGraph for Social Sharing */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonical} />
      </Head>

      <div className="space-y-16 pb-20">
        
        {/* 🏆 HERO SECTION - Now with improved text contrast */}
        <section className="relative rounded-[3.5rem] overflow-hidden bg-[#0a0f1d] border border-white/5 shadow-2xl p-10 md:p-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-[2px] w-12 bg-blue-600 rounded-full" />
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Establishment 2024</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter italic uppercase mb-8 font-display">
              Ang Inyong <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-200">Global Tambayan.</span>
            </h1>
            
            <p className="text-slate-400 text-xl leading-relaxed font-medium max-w-2xl">
              Pinoy Tambayan Hub is a modern sanctuary for the global Filipino. 
              We bridge the distance between home and wherever you are through <span className="text-white">music, news, and community.</span>
            </p>
          </div>
        </section>

        {/* ⚡ BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          
          {/* Main Mission Card */}
          <div className="md:col-span-4 bg-slate-900/40 border border-white/5 p-12 rounded-[3rem] flex flex-col justify-between hover:border-blue-500/30 transition-all group">
            <div>
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">
                <Radio size={28} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-6 font-display">The Mission</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Live Radio", desc: "24/7 OPM and PH-based FM streams." },
                  { title: "Local News", desc: "Real-time updates on weather and news." },
                  { title: "The Tiangge", desc: "A safe space for community affiliate finds." },
                  { title: "Pinoy Stories", desc: "User-submitted tales from the diaspora." }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <h4 className="text-blue-400 font-black uppercase text-[10px] tracking-widest">{item.title}</h4>
                    <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Identity Card */}
          <div className="md:col-span-2 bg-blue-600 rounded-[3rem] p-10 text-white flex flex-col justify-between relative overflow-hidden group">
            <Globe className="absolute -top-10 -right-10 w-48 h-48 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full">Pinoy Pride</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black uppercase italic leading-none mb-3 font-display">Para sa <br /> Kababayan</h3>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">From Manila to the World.</p>
            </div>
          </div>

          {/* Tech Card */}
          <div className="md:col-span-2 bg-[#0f172a] border border-white/5 rounded-[3rem] p-10 flex flex-col items-start group">
            <div className="mb-6 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <Zap size={24} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 font-display">Modern Stack</h3>
            <p className="text-slate-500 text-sm font-medium">Built with Next.js 15 for lightning-fast OPM streaming.</p>
          </div>

          {/* Feedback Card */}
          <div className="md:col-span-4 bg-gradient-to-r from-indigo-900/20 to-blue-900/10 border border-indigo-500/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="max-w-md">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-3 font-display">Your Voice Matters</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                This hub grows through community suggestions. If you have a radio station request or a feature idea, let us know!
              </p>
            </div>
            <Link href="/contact" className="shrink-0 w-20 h-20 bg-white text-indigo-900 rounded-[2rem] flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
              <MessageSquare size={32} />
            </Link>
          </div>
        </div>

        {/* 🚀 FINAL CTA */}
        <div className="flex flex-col items-center text-center gap-8 py-10">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/radio" className="group bg-blue-600 hover:bg-blue-500 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-blue-600/20 flex items-center gap-3">
               Start Tuning In <Radio size={16} className="group-hover:animate-pulse" />
            </Link>
            <Link href="/marketplace" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3">
               Browse Tiangge <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Mabuhay ang OPM • Support Local</p>
        </div>
      </div>
    </>
  );
}
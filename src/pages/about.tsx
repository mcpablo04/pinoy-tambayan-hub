"use client";

import Head from "next/head";
import Link from "next/link";
import { Radio, Heart, Zap, MessageSquare, ArrowRight } from "lucide-react";

const SITE_URL = "https://pinoytambayanhub.com"; 

export default function AboutPage() {
  const canonical = `${SITE_URL}/about`;
  const metaTitle = "About Us | Pinoy Tambayan Hub";
  const metaDesc = "Pinoy Tambayan Hub is your online tambayan for OPM radio, PH-localized news, weather, stories, and community chat — built by and for Filipinos.";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        {/* ... Rest of your SEO scripts and tags stay exactly the same ... */}
      </Head>

      <div className="space-y-16 pb-20">
        
        {/* 🏆 MINI HERO SECTION */}
        <section className="relative rounded-[3rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl p-8 md:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-900/30" />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-10 bg-blue-600 rounded-full" />
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">Our Story</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter italic uppercase mb-6">
              Ang Inyong <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">Global Tambayan.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              We started with a simple idea: To build a modern digital home for Filipinos worldwide. 
              Whether you're in Manila, Dubai, or New York, <span className="text-white">Pinoy Tambayan Hub</span> is where you stay connected to the heartbeat of the Philippines.
            </p>
          </div>
        </section>

        {/* ⚡ THE BENTO GRID FEATURES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Mission */}
          <div className="md:col-span-2 bg-slate-900/40 border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-between hover:border-blue-500/30 transition-all group">
            <div>
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <Radio size={24} />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">What we do</h2>
              <ul className="space-y-4">
                {[
                  "Curate 24/7 live Pinoy radio stations globally.",
                  "Real-time PH weather and localized news updates.",
                  "A secure community marketplace for local picks.",
                  "Interactive chat and community-driven stories."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Value Card 1 */}
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-end relative overflow-hidden group">
            <Heart className="absolute -top-6 -right-6 w-32 h-32 text-white/10 group-hover:rotate-12 transition-transform" />
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase italic leading-tight mb-2">Para sa Komunidad</h3>
              <p className="text-blue-100 text-sm font-medium">Built for kababayans who love OPM and chill vibes.</p>
            </div>
          </div>

          {/* Value Card 2 */}
          <div className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-end group">
            <div className="mb-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <Zap size={20} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic leading-tight mb-2">Fast & Simple</h3>
            <p className="text-slate-500 text-sm font-medium">A lightweight UI for a seamless listening experience.</p>
          </div>

          {/* Value Card 3 */}
          <div className="md:col-span-2 bg-indigo-900/20 border border-indigo-500/10 rounded-[2.5rem] p-10 flex items-center justify-between group">
            <div className="max-w-xs">
              <h3 className="text-2xl font-black text-white uppercase italic leading-tight mb-2">Have Feedback?</h3>
              <p className="text-slate-400 text-sm font-medium">We keep improving based on your suggestions — salamat sa suporta!</p>
            </div>
            <Link href="/contact" className="w-14 h-14 bg-white text-indigo-900 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </Link>
          </div>
        </div>

        {/* 🚀 CALL TO ACTION */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-10">
          <Link href="/radio" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3">
             Start Listening <Radio size={16} />
          </Link>
          <Link href="/stories" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3">
             Read Stories <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}
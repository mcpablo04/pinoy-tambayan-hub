"use client";

import Image from "next/image";
import MetaHead from "../components/MetaHead";
import { 
  Heart, Download, ExternalLink, Coffee, 
  Server, Shield, Sparkles 
} from "lucide-react";

export default function Support() {
  const perks = [
    { icon: Server, title: "Server Costs", desc: "Keeping the radio and forums running 24/7." },
    { icon: Shield, title: "Security", desc: "Maintaining a safe space for Pinoy stories." },
    { icon: Coffee, title: "Dev Coffee", desc: "Fueling the updates and new features." },
  ];

  return (
    <>
      <MetaHead 
        title="Support the Hub • Pinoy Tambayan Hub" 
        description="Tulungan kaming mapanatiling buhay ang ating online tambayan. Maraming salamat sa inyong suporta!"
      />

      <section className="min-h-screen pt-28 pb-20 bg-[#020617] text-slate-200 selection:bg-blue-500/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* 🎭 HEADER SECTION */}
          <div className="text-center mb-16 relative">
            {/* Subtle background glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-blue-600/10 text-blue-500 mb-6 border border-blue-500/20 backdrop-blur-sm animate-pulse">
              <Heart size={40} fill="currentColor" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-6 leading-none">
              Support Pinoy <br /> <span className="text-blue-500">Tambayan Hub</span>
            </h1>
            
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              Salamat sa suporta! 🙏 Ang simpleng donasyon mo ay malaking tulong para mapanatiling buhay
              ang ating tambayan – mula sa kwento at forums, hanggang sa OPM vibes.
            </p>
          </div>

          {/* 🧊 PERKS BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            {perks.map((item, i) => (
              <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] text-center group hover:border-blue-500/30 transition-all duration-500 shadow-xl">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="text-blue-500" size={24} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-2">{item.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 💸 DONATION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* GCash */}
            <div className="group bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 shadow-2xl transition-all hover:border-blue-500/30">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic text-blue-400 uppercase leading-none">GCash</h2>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Wallet</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Sparkles size={20} />
                </div>
              </div>
              
              <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-8 bg-white p-5 rounded-[2.5rem] shadow-2xl group-hover:scale-[1.03] transition-transform duration-500">
                <Image
                  src="/images/gcash-qr.jpg"
                  alt="GCash QR Code"
                  fill
                  priority
                  className="object-contain p-4"
                />
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href="/images/gcash-qr.jpg"
                  download="gcash-qr.jpg"
                  className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Download size={18} /> Download QR
                </a>
                <a
                  href="/images/gcash-qr.jpg"
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <ExternalLink size={12} /> View Fullscreen
                </a>
              </div>
            </div>

            {/* Maya */}
            <div className="group bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 shadow-2xl transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic text-emerald-400 uppercase leading-none">Maya</h2>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Bank</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <Sparkles size={20} />
                </div>
              </div>
              
              <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-8 bg-white p-5 rounded-[2.5rem] shadow-2xl group-hover:scale-[1.03] transition-transform duration-500">
                <Image
                  src="/images/maya-qr.jpg"
                  alt="Maya QR Code"
                  fill
                  priority
                  className="object-contain p-4"
                />
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href="/images/maya-qr.jpg"
                  download="maya-qr.jpg"
                  className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <Download size={18} /> Download QR
                </a>
                <a
                  href="/images/maya-qr.jpg"
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <ExternalLink size={12} /> View Fullscreen
                </a>
              </div>
            </div>
          </div>

          {/* 📝 FOOTER NOTE */}
          <div className="mt-20 text-center border-t border-white/5 pt-12">
            <p className="text-slate-500 text-sm font-black italic uppercase tracking-tighter">
              "Walang maliit na tulong, basta galing sa puso."
            </p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-slate-800" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
                Maraming salamat sa pagtangkilik! 🇵🇭
              </p>
              <div className="h-px w-8 bg-slate-800" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
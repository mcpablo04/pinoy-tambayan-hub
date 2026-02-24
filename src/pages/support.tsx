import Image from "next/image";
import MetaHead from "../components/MetaHead";
import { Heart, Download, ExternalLink, Coffee, Server, Shield } from "lucide-react";

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

      <section className="min-h-screen pt-28 pb-20 bg-[#020617] text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 mb-4">
              <Heart size={32} fill="currentColor" />
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
              Support Pinoy Tambayan Hub
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Salamat sa suporta! 🙏 Ang simpleng donasyon mo ay malaking tulong para mapanatiling buhay
              ang ating tambayan – mula sa kwento at forums, hanggang sa OPM vibes.
            </p>
          </div>

          {/* Perks/Why Support Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {perks.map((item, i) => (
              <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl text-center">
                <item.icon className="mx-auto mb-3 text-blue-500" size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Donation QR Codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* GCash */}
            <div className="group bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all hover:border-blue-500/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black italic text-blue-400 uppercase leading-none">GCash</h2>
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md uppercase tracking-widest">Digital Wallet</span>
              </div>
              
              <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-6 bg-white p-4 rounded-3xl shadow-inner group-hover:scale-[1.02] transition-transform">
                <Image
                  src="/images/gcash-qr.jpg"
                  alt="GCash QR Code"
                  fill
                  priority
                  className="object-contain p-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="/images/gcash-qr.jpg"
                  download="gcash-qr.jpg"
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest transition-all"
                >
                  <Download size={16} /> Download QR
                </a>
                <a
                  href="/images/gcash-qr.jpg"
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <ExternalLink size={12} /> View Fullscreen
                </a>
              </div>
            </div>

            {/* Maya */}
            <div className="group bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black italic text-emerald-400 uppercase leading-none">Maya</h2>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md uppercase tracking-widest">Digital Bank</span>
              </div>
              
              <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-6 bg-white p-4 rounded-3xl shadow-inner group-hover:scale-[1.02] transition-transform">
                <Image
                  src="/images/maya-qr.jpg"
                  alt="Maya QR Code"
                  fill
                  priority
                  className="object-contain p-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="/images/maya-qr.jpg"
                  download="maya-qr.jpg"
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest transition-all"
                >
                  <Download size={16} /> Download QR
                </a>
                <a
                  href="/images/maya-qr.jpg"
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <ExternalLink size={12} /> View Fullscreen
                </a>
              </div>
            </div>
          </div>

          {/* Thank you note */}
          <div className="mt-16 text-center border-t border-white/5 pt-10">
            <p className="text-slate-500 text-sm font-medium italic">
              "Walang maliit na tulong, basta galing sa puso."
            </p>
            <p className="mt-2 text-slate-400 text-xs font-black uppercase tracking-[0.3em]">
              Maraming salamat sa pagtangkilik! 🇵🇭
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
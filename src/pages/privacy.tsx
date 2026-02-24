import Link from "next/link";
import Head from "next/head";
import { ShieldCheck, Eye, Database, Cookie, UserCheck, MessageSquare } from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "March 2025";

  return (
    <>
      <Head>
        <title>Privacy Policy | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Learn how Pinoy Tambayan Hub collects, uses, and protects your personal information. Your privacy matters to us."
        />
      </Head>

      <section className="py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          {/* 🛡️ HEADER */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 mb-6">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
              Privacy <span className="text-blue-500">Policy</span>
            </h1>
            <p className="text-slate-500 font-medium tracking-widest uppercase text-[10px]">
              Last updated: <span className="text-slate-300">{lastUpdated}</span>
            </p>
          </div>

          <div className="space-y-6">
            {/* INTRO */}
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 leading-relaxed text-slate-300 shadow-xl">
              <p>
                Your privacy matters to us. At <strong>Pinoy Tambayan Hub</strong>, we believe in being 
                transparent about the data we collect and how it's used to provide you with the best 
                OPM and community experience.
              </p>
            </div>

            {/* WHAT WE COLLECT */}
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-xl group">
              <div className="flex items-center gap-3 mb-6 text-blue-400">
                <Database size={20} />
                <h2 className="text-lg font-black uppercase tracking-tight text-white italic">Information We Collect</h2>
              </div>
              <ul className="space-y-4">
                {[
                  { label: "Account info", desc: "Display name, email, profile photo, and optional handle." },
                  { label: "Content you create", desc: "Stories, comments, and reactions shared within the hub." },
                  { label: "Usage data", desc: "Analytics like pages viewed and device info for performance tuning." },
                  { label: "Location (Optional)", desc: "Coordinates for local weather forecasts, only when explicitly permitted." },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <p className="text-slate-400 text-sm leading-relaxed">
                      <span className="text-white font-bold">{item.label}</span>: {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* HOW WE USE IT */}
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6 text-emerald-400">
                <Eye size={20} />
                <h2 className="text-lg font-black uppercase tracking-tight text-white italic">How We Use Information</h2>
              </div>
              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-400">
                  To provide features like the <span className="text-white">Radio Player</span>, community chat, and local weather.
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-400">
                  To moderate content and protect our members from <span className="text-white">spam or abuse</span>.
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-slate-400">
                  To improve the hub using de-identified analytics that help us understand what you love.
                </div>
              </div>
            </div>

            {/* COOKIES & ADS */}
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6 text-amber-400">
                <Cookie size={20} />
                <h2 className="text-lg font-black uppercase tracking-tight text-white italic">Cookies & Ads</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                We use essential cookies for login and security. Ads may be served via <strong>Google AdSense</strong>, 
                which may use cookies to show relevant content.
              </p>
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
              >
                View Google Ads Policy <span className="text-xs">→</span>
              </a>
            </div>

            {/* YOUR CHOICES */}
            <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6 text-purple-400">
                <UserCheck size={20} />
                <h2 className="text-lg font-black uppercase tracking-tight text-white italic">Your Choices</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                You have full control over your data on Pinoy Tambayan Hub.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/account" className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
                  Update Profile
                </Link>
                <Link href="/contact" className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
                  Request Deletion
                </Link>
              </div>
            </div>

            {/* CONTACT FOOTER */}
            <div className="p-8 rounded-[2rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20 text-center">
              <div className="flex justify-center mb-4">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-xl font-black uppercase italic mb-2">Questions?</h2>
              <p className="text-blue-100 text-sm mb-6">
                Reach out to us anytime if you have questions regarding your data.
              </p>
              <Link href="/contact" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="h-20" />
        </div>
      </section>
    </>
  );
}
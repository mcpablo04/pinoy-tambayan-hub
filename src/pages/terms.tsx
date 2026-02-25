"use client";

import Link from "next/link";
import MetaHead from "../components/MetaHead";
import { Scale, ShieldAlert, Users, Fingerprint, Copyright, Info, Radio } from "lucide-react";

const LAST_UPDATED = "February 2026";

export default function TermsPage() {
  const sections = [
    {
      id: 1,
      title: "Using the Hub",
      icon: Info,
      content: "By accessing Pinoy Tambayan Hub, you agree to these Terms and our Privacy Policy. If you do not agree, please discontinue use immediately. These terms apply to all visitors, users, and others who access the service."
    },
    {
      id: 2,
      title: "Your Content",
      icon: Users,
      points: [
        "You own your stories, forum posts, and comments, but you grant us a license to host and display them.",
        "You confirm you have the rights to post your content and it doesn't break copyright laws.",
        "We are a platform for community interaction, not the author of user-generated content."
      ]
    },
    {
      id: 3,
      title: "Tambayan Radio & Media",
      icon: Radio,
      points: [
        "Our Radio feature acts as a portal to third-party OPM and community streams.",
        "We do not own, host, or claim copyright over the music broadcasted; all rights belong to the respective artists/labels.",
        "Streaming is provided for non-commercial, promotional, and entertainment purposes only.",
        "We are not responsible for the uptime or content of external third-party streams."
      ]
    },
    {
      id: 4,
      title: "Community Rules",
      icon: ShieldAlert,
      points: [
        "Be respectful; no harassment, hate speech, or 'bardagulan' that crosses the line into abuse.",
        "No spam, scams, or illegal activities within the forums or chat sections.",
        "No explicit or pornographic material. This is a community-centric tambayan.",
        "We reserve the right to moderate, edit, or remove content at our sole discretion."
      ]
    },
    {
      id: 5,
      title: "Accounts & Security",
      icon: Fingerprint,
      content: "You are responsible for keeping your login credentials safe. We may suspend or terminate accounts that violate these terms or pose a security risk to the community."
    },
    {
      id: 6,
      title: "Intellectual Property",
      icon: Copyright,
      content: "The Pinoy Tambayan Hub branding, UI design, logos, and original code are our property. Please do not copy, modify, or reverse engineer our assets without explicit permission."
    }
  ];

  return (
    <>
      <MetaHead 
        title="Terms of Service | Pinoy Tambayan Hub" 
        description="Read the rules and guidelines for using Pinoy Tambayan Hub. Updated for 2026 community standards."
      />

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms of Service",
            "dateModified": "2026-02-25",
            "publisher": {
              "@type": "Organization",
              "name": "Pinoy Tambayan Hub",
              "url": "https://pinoytambayanhub.com"
            }
          }),
        }}
      />

      <section className="min-h-screen pt-32 pb-20 bg-[#020617] text-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          
          {/* ⚖️ HEADER */}
          <div className="mb-16 relative">
             <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-3 text-blue-500 mb-4">
              <Scale size={28} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Legal Framework</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
              Terms of <span className="text-blue-500">Service</span>
            </h1>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Last updated: <span className="text-slate-300">{LAST_UPDATED}</span>
              </p>
            </div>
          </div>

          {/* 📝 CONTENT SECTIONS */}
          <div className="grid grid-cols-1 gap-6">
            {sections.map((section) => (
              <div 
                key={section.id} 
                className="group bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 md:p-10 hover:border-blue-500/20 transition-all duration-500 shadow-xl"
              >
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-500">
                    <section.icon size={22} />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                    {section.id}. {section.title}
                  </h2>
                </div>
                
                {section.content && (
                  <p className="text-slate-400 leading-relaxed text-[15px] font-medium">
                    {section.content}
                  </p>
                )}

                {section.points && (
                  <ul className="space-y-4">
                    {section.points.map((point, idx) => (
                      <li key={idx} className="flex gap-4 text-[14px] text-slate-400 font-medium leading-relaxed group/item">
                        <span className="text-blue-600 font-black mt-0.5 group-hover/item:translate-x-1 transition-transform">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* ⚠️ LIABILITY & CONTACT */}
            <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight mb-4 flex items-center gap-3">
                   Liability & Disclaimers
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  The service is provided on an "as is" and "as available" basis. Pinoy Tambayan Hub does not warrant that the service will be uninterrupted or error-free. We are not liable for any direct, indirect, or incidental damages resulting from your use of the site or third-party media streams.
                </p>
                <div className="pt-8 border-t border-white/10">
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">
                    Got questions? <Link href="/contact" className="text-blue-500 hover:text-white underline decoration-blue-500/50 hover:decoration-white decoration-2 underline-offset-8 transition-all">Contact the Admin Team</Link>
                  </p>
                </div>
              </div>
              {/* Decorative background icon */}
              <Scale size={120} className="absolute -bottom-4 -right-4 text-blue-500/5 rotate-12 pointer-events-none" />
            </div>
          </div>

          {/* 🇵🇭 FOOTER */}
          <div className="mt-24 text-center">
            <div className="h-px w-16 bg-slate-800 mx-auto mb-8" />
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
              Pinoy Tambayan Hub &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
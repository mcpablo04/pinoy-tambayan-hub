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

      <section className="min-h-screen pt-28 pb-20 bg-[#020617] text-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <Scale size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Legal Framework</span>
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
              Terms of Service
            </h1>
            <p className="text-slate-500 text-sm font-bold">
              Last updated: <span className="text-blue-400/80">{LAST_UPDATED}</span>
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                    <section.icon size={20} />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                    {section.id}. {section.title}
                  </h2>
                </div>
                
                {section.content && (
                  <p className="text-slate-400 leading-relaxed text-sm font-medium">
                    {section.content}
                  </p>
                )}

                {section.points && (
                  <ul className="space-y-3">
                    {section.points.map((point, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-400 font-medium leading-relaxed">
                        <span className="text-blue-600 font-black">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Liability & Contact */}
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-[2rem] p-8">
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight mb-4">
                7. Liability & Disclaimers
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                The service is provided on an "as is" and "as available" basis. Pinoy Tambayan Hub does not warrant that the service will be uninterrupted or error-free. We are not liable for any direct, indirect, or incidental damages resulting from your use of the site or third-party media streams.
              </p>
              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Got questions? <Link href="/contact" className="text-blue-500 hover:text-blue-400 underline decoration-2 underline-offset-4 transition-colors">Contact the Admin Team</Link>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
              Pinoy Tambayan Hub &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
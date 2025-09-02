// src/pages/tools.tsx
import Head from "next/head";
import Link from "next/link";

const TOOLS = [
  {
    name: "🎤 Karaoke Roulette",
    href: "/tools/karaoke",
    desc: "Spin a random OPM hit to sing — perfect for tambayan nights.",
  },
  {
    name: "📱 E-load Calculator",
    href: "/tools/eload",
    desc: "Compute prepaid load totals with fees/discounts.",
  },
];

export default function ToolsPage() {
  const title = "Pinoy Tambayan Hub — Tools";
  const description =
    "Fun and useful one-page tools for Pinoy Tambayan Hub: Karaoke Roulette, E-load Calculator, and more.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://pinoytambayanhub.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: "https://pinoytambayanhub.com/tools",
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* OpenGraph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pinoytambayanhub.com/tools" />
        <meta property="og:image" content="https://pinoytambayanhub.com/brand/og-card.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <link rel="canonical" href="https://pinoytambayanhub.com/tools" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <section className="pt-20 max-w-6xl mx-auto px-4 text-lighttext">
        <h1 className="text-3xl font-bold mb-3">🛠️ Pinoy Tambayan Tools</h1>
        <p className="text-gray-400 mb-8">
          Fun and useful one-page utilities built for the community. Family-friendly and AdSense-ready.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="card hover:bg-gray-800 transition">
              <h2 className="text-xl font-semibold mb-2">{t.name}</h2>
              <p className="text-gray-300 text-sm">{t.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-sm text-gray-500">
          <p className="mb-2 font-semibold">AdSense note:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Original, helpful content with descriptive text blocks.</li>
            <li>No adult, gambling, or pirated content. No embedded copyrighted media.</li>
            <li>Clear navigation and good UX for higher engagement.</li>
          </ul>
        </div>
      </section>
    </>
  );
}

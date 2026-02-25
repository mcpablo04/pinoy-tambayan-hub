"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../lib/firebase"; // Standardized import
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, ExternalLink, ShoppingBag, ShieldCheck } from "lucide-react";

type Product = {
  title: string;
  slug?: string | null;
  category?: string | null;
  pricePhp?: number | null;
  rating?: number | null;
  store?: string | null;
  imageUrl: string;
  affiliateUrl: string;
  blurb?: string | null;
  ownerUid: string;
  ownerName?: string | null;
  createdAt?: { seconds: number } | null;
  updatedAt?: { seconds: number } | null;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pinoytambayanhub.com").replace(/\/+$/, "");

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

export default function ProductDetailPage() {
  const router = useRouter();
  const idSlugParam = Array.isArray(router.query.idSlug) ? router.query.idSlug[0] : router.query.idSlug || "";

  const dash = idSlugParam.indexOf("-");
  const idFromUrl = dash >= 0 ? idSlugParam.slice(0, dash) : idSlugParam;
  const slugFromUrl = dash >= 0 ? idSlugParam.slice(dash + 1) : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idFromUrl) return;
    (async () => {
      try {
        const snapshot = await getDoc(doc(db, "products", idFromUrl));
        if (!snapshot.exists()) {
          setNotFound(true);
          return;
        }
        const data = snapshot.data() as any;
        setProduct(data as Product);

        // SEO/UX: Canonical redirect if slug is messy
        const canonicalSlug = data.slug || slugify(data.title || "");
        if (canonicalSlug && slugFromUrl !== canonicalSlug) {
          router.replace(`/marketplace/p/${idFromUrl}-${canonicalSlug}`, undefined, { shallow: true });
        }
      } catch (err) {
        console.error("Firestore fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [idFromUrl, slugFromUrl, router]);

  const canonicalUrl = useMemo(() => {
    if (!idFromUrl) return `${SITE_URL}/marketplace`;
    const s = product?.slug || (product?.title ? slugify(product.title) : "");
    return `${SITE_URL}/marketplace/p/${idFromUrl}-${s}`;
  }, [product, idFromUrl]);

  if (notFound) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Head><title>Not Found • Pinoy Hub</title></Head>
        <h1 className="text-4xl font-black italic uppercase text-white mb-4">Item Missing</h1>
        <p className="text-slate-400 mb-8">It seems this item was sold or removed from the marketplace.</p>
        <Link href="/marketplace" className="bg-blue-600 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest text-white transition-transform hover:scale-105">
          Go Back
        </Link>
      </main>
    );
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const title = `${product.title} • Pinoy Tambayan Marketplace`;
  const desc = product.blurb?.slice(0, 160) || `Check out ${product.title} on our community marketplace.`;

  return (
    <div className="pb-20 pt-10 px-4 md:px-8 max-w-7xl mx-auto">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:image" content={product.imageUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          image: [product.imageUrl],
          description: product.blurb,
          brand: product.store,
          offers: {
            "@type": "Offer",
            priceCurrency: "PHP",
            price: product.pricePhp,
            availability: "https://schema.org/InStock",
            url: product.affiliateUrl,
          }
        }) }} />
      </Head>

      <Link href="/marketplace" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Market
      </Link>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Left: Image Container */}
        <div className="lg:col-span-7">
          <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[3rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl group">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {product.category && (
              <div className="absolute top-6 left-6 bg-blue-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                {product.category}
              </div>
            )}
          </div>
        </div>

        {/* Right: Info & Buy Section */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-blue-500" />
            <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Verified Listing</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none mb-6">
            {product.title}
          </h1>

          <div className="mb-8 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Current Price</p>
            <div className="text-4xl font-black text-white">{peso(product.pricePhp)}</div>
          </div>

          <p className="text-slate-400 leading-relaxed text-lg mb-10">
            {product.blurb || "No detailed description provided for this community pick."}
          </p>

          <div className="space-y-4">
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              <ShoppingBag size={18} /> Buy on {product.store || "Merchant"}
            </a>
            
            <div className="flex items-center justify-center gap-4 text-slate-500 text-[9px] font-black uppercase tracking-[0.1em]">
              <span className="flex items-center gap-1"><ExternalLink size={10} /> Secure Merchant Link</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span>Posted by {product.ownerName || "Anonymous"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
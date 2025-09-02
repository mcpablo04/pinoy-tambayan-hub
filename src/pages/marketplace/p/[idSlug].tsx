// src/pages/marketplace/p/[idSlug].tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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

  useEffect(() => {
    if (!idFromUrl) return;
    (async () => {
      const snapshot = await getDoc(doc(db, "products", idFromUrl));
      if (!snapshot.exists()) {
        setNotFound(true);
        return;
      }
      const data = snapshot.data() as any;
      setProduct({
        title: data.title,
        slug: data.slug ?? null,
        category: data.category ?? null,
        pricePhp: data.pricePhp ?? null,
        rating: data.rating ?? null,
        store: data.store ?? null,
        imageUrl: data.imageUrl,
        affiliateUrl: data.affiliateUrl,
        blurb: data.blurb ?? null,
        ownerUid: data.ownerUid,
        ownerName: data.ownerName ?? null,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      });

      // Normalize slug in the URL (e.g., /p/<id>-<slug>)
      const canonicalSlug = (data.slug && String(data.slug)) || slugify(String(data.title || ""));
      if (canonicalSlug && slugFromUrl !== canonicalSlug) {
        router.replace(`/marketplace/p/${idFromUrl}-${canonicalSlug}`, undefined, { shallow: true });
      }
    })();
  }, [idFromUrl, slugFromUrl, router]);

  const canonicalUrl = useMemo(() => {
    if (!idFromUrl) return `${SITE_URL}/marketplace`;
    const s = product?.slug || (product?.title ? slugify(product.title) : "");
    return s ? `${SITE_URL}/marketplace/p/${idFromUrl}-${s}` : `${SITE_URL}/marketplace/p/${idFromUrl}`;
  }, [product?.slug, product?.title, idFromUrl]);

  if (notFound) {
    return (
      <>
        <Head>
          <title>Product not found • Marketplace • Pinoy Tambayan Hub</title>
          <meta name="robots" content="noindex,follow" />
        </Head>
        <main className="container-page section">
          <h1 className="page-title">Product not found</h1>
          <p className="text-gray-300">This item may have been deleted or the link is incorrect.</p>
          <div className="mt-3">
            <Link href="/marketplace" className="text-blue-400 hover:underline">
              ← Back to Marketplace
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <main className="container-page section">
        <div className="card">Loading…</div>
      </main>
    );
  }

  const title = `${product.title} • Marketplace • Pinoy Tambayan Hub`;
  const desc =
    product.blurb?.slice(0, 160) ||
    `Community pick from the marketplace. Check details and buy via the merchant link.`;
  const ogImg = product.imageUrl; // external absolute URL is fine for OG

  // JSON-LD Product schema
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [product.imageUrl],
    description: product.blurb || undefined,
    brand: product.store || undefined,
    category: product.category || undefined,
    aggregateRating:
      typeof product.rating === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: 1,
          }
        : undefined,
    offers:
      typeof product.pricePhp === "number"
        ? {
            "@type": "Offer",
            priceCurrency: "PHP",
            price: product.pricePhp,
            availability: "https://schema.org/InStock",
            url: product.affiliateUrl,
          }
        : undefined,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Twitter */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={ogImg} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImg} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
      </Head>

      <main className="container-page section">
        <div className="mb-3">
          <Link href="/marketplace" className="text-blue-400 hover:underline">
            ← Back to Marketplace
          </Link>
        </div>

        <article className="grid md:grid-cols-5 gap-5">
          {/* Image */}
          <div className="md:col-span-3">
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
          </div>

          {/* Meta / CTA */}
          <div className="md:col-span-2">
            <h1 className="page-title mb-2">{product.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-3">
              {product.category && (
                <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs">
                  {product.category}
                </span>
              )}
              {product.store && <span className="text-xs text-neutral-400">via {product.store}</span>}
            </div>

            <div className="text-2xl font-semibold mb-3">{peso(product.pricePhp)}</div>

            {product.blurb && <p className="text-gray-200 mb-4">{product.blurb}</p>}

            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="btn btn-primary px-5 py-3"
            >
              Buy on {product.store || "merchant"} →
            </a>

            <p className="mt-2 text-[11px] leading-snug text-neutral-500">
              This uses an affiliate link. You (and other posters) may earn commissions from their own affiliate
              links posted here. Prices and availability can change—please verify on the merchant site.
            </p>

            <div className="mt-4 text-[12px] text-neutral-500">
              Posted by {product.ownerName || "User"}
            </div>
          </div>
        </article>
      </main>
    </>
  );
}

import Head from "next/head";
import { useRouter } from "next/router";

type MetaHeadProps = {
  title: string;
  description?: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
  robots?: string;
  type?: "website" | "article" | "profile"; // Added for better OG targeting
};

const SITE_NAME = "Pinoy Tambayan Hub";
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://pinoytambayanhub.com";
const DEFAULT_IMAGE = "/brand/og-cover.png";
const DEFAULT_DESC = "Ang pambansang tambayan online. OPM, stories, and Filipino community vibes.";

function absoluteUrl(u?: string) {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

function normalizeCanonical(u: string) {
  try {
    const url = new URL(u);
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return u;
  }
}

export default function MetaHead({
  title,
  description = DEFAULT_DESC,
  image,
  canonical,
  noindex,
  robots,
  type = "website"
}: MetaHeadProps) {
  const router = useRouter();
  const path = (router.asPath || "/").split("#")[0].split("?")[0] || "/";
  const computed = canonical || `${BASE_URL}${path}`;
  const canonicalUrl = normalizeCanonical(computed);
  const ogImage = absoluteUrl(image || DEFAULT_IMAGE);
  const robotsContent = robots ?? (noindex ? "noindex, nofollow" : "index, follow");

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  // Structured Data for Google Search
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      {/* OpenGraph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content="en_PH" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Theme Color for Mobile Browsers */}
      <meta name="theme-color" content="#020617" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
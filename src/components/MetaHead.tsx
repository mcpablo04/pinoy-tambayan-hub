// src/components/MetaHead.tsx
import Head from "next/head";
import { useRouter } from "next/router";

type MetaHeadProps = {
  title: string;
  description: string;
  image?: string;        // site-relative or absolute (defaults to /brand/og-cover.png)
  canonical?: string;    // absolute override (optional)
  noindex?: boolean;     // when true -> <meta name="robots" content="noindex" />
  robots?: string;       // advanced override, e.g. "noindex,follow"
};

const SITE_NAME = "Pinoy Tambayan Hub";
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://pinoytambayanhub.com";
const DEFAULT_IMAGE = "/brand/og-cover.png";

function absoluteUrl(u?: string) {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

export default function MetaHead({
  title,
  description,
  image,
  canonical,
  noindex,
  robots,
}: MetaHeadProps) {
  const router = useRouter();
  const path = (router.asPath || "/").split("#")[0].split("?")[0] || "/";
  const canonicalUrl = canonical || `${BASE_URL}${path}`;
  const ogImage = absoluteUrl(image || DEFAULT_IMAGE);

  // Prefer explicit robots; else emit just "noindex" when requested.
  const robotsContent = robots ?? (noindex ? "noindex" : undefined);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {robotsContent && <meta name="robots" content={robotsContent} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* OG */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  );
}

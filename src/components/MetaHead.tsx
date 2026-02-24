import Head from "next/head";
import { useRouter } from "next/router";

type MetaHeadProps = {
  title: string;
  description?: string; // Made optional
  image?: string;
  canonical?: string;
  noindex?: boolean;
  robots?: string;
};

const SITE_NAME = "Pinoy Tambayan Hub";
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://pinoytambayanhub.com";
const DEFAULT_IMAGE = "/brand/og-cover.png";
const DEFAULT_DESC = "Your digital tambayan for OPM, stories, and community.";

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
  description = DEFAULT_DESC, // Default fallback
  image,
  canonical,
  noindex,
  robots,
}: MetaHeadProps) {
  const router = useRouter();
  const path = (router.asPath || "/").split("#")[0].split("?")[0] || "/";
  const computed = canonical || `${BASE_URL}${path}`;
  const canonicalUrl = normalizeCanonical(computed);
  const ogImage = absoluteUrl(image || DEFAULT_IMAGE);
  const robotsContent = robots ?? (noindex ? "noindex" : undefined);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {robotsContent && <meta name="robots" content={robotsContent} />}
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  );
}
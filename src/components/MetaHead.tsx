// src/components/MetaHead.tsx
import Head from "next/head";

type MetaHeadProps = {
  title?: string;
  description?: string;
  path?: string;      // e.g. "/profile"
  robots?: string;    // e.g. "noindex,follow"
  image?: string;     // absolute or site-relative OG image
};

const SITE_NAME = "Pinoy Tambayan Hub";
// Set this in your env (recommended): NEXT_PUBLIC_SITE_URL=https://your-domain
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function MetaHead({
  title,
  description = "Pinoy Tambayan Hub — tambayan for OPM radio, weather, news, and stories.",
  path = "",
  robots,
  image,
}: MetaHeadProps) {
  const fullTitle = title || SITE_NAME;
  const url = BASE_URL && path ? `${BASE_URL}${path}` : undefined;
  const ogImage = image || (BASE_URL ? `${BASE_URL}/og-default.jpg` : undefined);

  return (
    <Head>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {robots && <meta name="robots" content={robots} />}
      {url && <link rel="canonical" href={url} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  );
}

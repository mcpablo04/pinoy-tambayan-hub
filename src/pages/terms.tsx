// src/pages/terms.tsx
import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://pinoytambayanhub.com"; // update if different
const LAST_UPDATED = "March 2025";

export default function TermsPage() {
  const canonical = `${SITE_URL}/terms`;
  const metaTitle = "Terms of Service | Pinoy Tambayan Hub";
  const metaDesc =
    "Read the Terms of Service for Pinoy Tambayan Hub, including rules for user content, community guidelines, accounts, and liability.";

  return (
    <>
      {/* SEO */}
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content="Terms of Service" />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="/brand/og-cover.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service" />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content="/brand/og-cover.png" />

        {/* JSON-LD: Legal page */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Terms of Service",
              description: metaDesc,
              url: canonical,
              isPartOf: {
                "@type": "WebSite",
                name: "Pinoy Tambayan Hub",
                url: SITE_URL,
              },
              dateModified: new Date("2025-03-01").toISOString(), // adjust the exact date if needed
            }),
          }}
        />
      </Head>

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="page-title">📜 Terms of Service</h1>
          <p className="text-gray-400 mb-4">
            Last updated: <span className="text-gray-300">{LAST_UPDATED}</span>
          </p>

          {/* Using the Site */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">1) Using Pinoy Tambayan Hub</h2>
            <p className="text-gray-300">
              By accessing or using this site, you agree to these Terms and our Privacy Policy.
              If you do not agree, please discontinue use.
            </p>
          </div>

          {/* User Content */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">2) Your Content</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>You are responsible for content you post (stories, comments, reactions).</li>
              <li>
                You grant us a worldwide, non-exclusive, royalty-free license to host, display, and
                distribute your content on the service.
              </li>
              <li>
                You confirm you have the rights to post it and that it does not infringe any third-party rights.
              </li>
            </ul>
          </div>

          {/* Community Rules */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">3) Community Rules</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Be respectful; no harassment, hate speech, or threats.</li>
              <li>No spam, scams, or illegal content/activity.</li>
              <li>No explicit, pornographic, or excessively violent material.</li>
              <li>We may moderate, edit, or remove content at our discretion.</li>
            </ul>
          </div>

          {/* Accounts & Security */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">4) Accounts & Security</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Keep your login credentials safe; you’re responsible for activity on your account.</li>
              <li>
                We may suspend or terminate accounts that violate these Terms or pose a risk to others.
              </li>
            </ul>
          </div>

          {/* Intellectual Property */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">5) Intellectual Property</h2>
            <p className="text-gray-300">
              The Pinoy Tambayan Hub name, logo, UI, and code are protected. Do not copy, reverse engineer,
              or misuse our assets except as permitted by law.
            </p>
          </div>

          {/* Disclaimers & Liability */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">6) Disclaimers & Limitation of Liability</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>The service is provided “as is” without warranties of any kind.</li>
              <li>
                We are not liable for indirect or consequential damages, or for third-party content and links.
              </li>
            </ul>
          </div>

          {/* Changes */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">7) Changes to These Terms</h2>
            <p className="text-gray-300">
              We may update these Terms from time to time. Continued use after changes means you accept
              the updated Terms.
            </p>
          </div>

          {/* Contact */}
          <div className="card">
            <h2 className="font-semibold text-white mb-2">Contact</h2>
            <p className="text-gray-300">
              Questions? Reach us via{" "}
              <Link href="/contact" className="text-blue-400 hover:underline">
                Contact
              </Link>
              .
            </p>
          </div>

          <div className="page-bottom-spacer" />
        </div>
      </section>
    </>
  );
}

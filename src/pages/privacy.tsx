// src/pages/privacy.tsx
import Link from "next/link";
import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Learn how Pinoy Tambayan Hub collects, uses, and protects your personal information. Your privacy matters to us."
        />
        <meta property="og:title" content="Privacy Policy | Pinoy Tambayan Hub" />
        <meta
          property="og:description"
          content="Learn how Pinoy Tambayan Hub collects, uses, and protects your personal information."
        />
        <meta property="og:type" content="website" />
      </Head>

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="page-title">🔒 Privacy Policy</h1>
          <p className="text-gray-400 mb-4">
            Last updated: <span className="text-gray-300">March 2025</span>
          </p>

          {/* Intro */}
          <div className="card mb-4">
            <p className="text-gray-300">
              Your privacy matters to us. This page explains what we (Pinoy Tambayan Hub)
              collect, how we use it, and the choices you have.
            </p>
          </div>

          {/* What we collect */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>
                <span className="text-gray-100">Account info</span>: display name,
                email, profile photo, and optional handle.
              </li>
              <li>
                <span className="text-gray-100">Content you create</span>: stories,
                comments, reactions.
              </li>
              <li>
                <span className="text-gray-100">Usage data</span>: basic analytics (pages viewed,
                device/browser info). IP may be processed by providers for security.
              </li>
              <li>
                <span className="text-gray-100">Location (optional)</span>: when you opt into the
                Weather page’s “Use my location.” Coordinates are used only to fetch forecasts.
              </li>
            </ul>
          </div>

          {/* How we use it */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Provide features (radio player, chat, stories, comments, weather).</li>
              <li>Moderate and protect the community from spam/abuse.</li>
              <li>Improve the product using aggregate, de-identified analytics.</li>
            </ul>
          </div>

          {/* Cookies / ads */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">Cookies & Ads</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>We use essential cookies for login and security.</li>
              <li>
                Ads may be served via Google AdSense. Google may use cookies/IDs for relevant ads.
                Learn more at{" "}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Google Ads Policy
                </a>.
              </li>
            </ul>
          </div>

          {/* Data control */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">Your Choices</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Update your profile details from your account page.</li>
              <li>Delete your stories or comments you authored.</li>
              <li>
                Request account deletion or data export via our{" "}
                <Link href="/contact" className="text-blue-400 hover:underline">
                  Contact
                </Link>{" "}
                page.
              </li>
            </ul>
          </div>

          {/* Sharing */}
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">How We Share Information</h2>
            <p className="text-gray-300">
              We don’t sell your data. We share limited info with providers
              (hosting, analytics, auth) only to operate the site. We may disclose
              info if required by law or to protect our community.
            </p>
          </div>

          {/* Contact */}
          <div className="card">
            <h2 className="font-semibold text-white mb-2">Contact Us</h2>
            <p className="text-gray-300">
              Questions or requests? Reach us via{" "}
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

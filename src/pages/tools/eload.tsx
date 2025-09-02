// src/pages/tools/eload.tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function EloadCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [serviceFee, setServiceFee] = useState<string>("2");
  const [discountPct, setDiscountPct] = useState<string>("0");

  const title = "E-load Calculator — Pinoy Tambayan Hub";
  const description =
    "Compute prepaid load totals fast, including service fees and optional discounts (reseller margin).";

  const numbers = useMemo(() => {
    const amt = Math.max(0, Number(amount || 0));
    const fee = Math.max(0, Number(serviceFee || 0));
    const disc = Math.min(100, Math.max(0, Number(discountPct || 0)));
    const discounted = amt * (1 - disc / 100);
    const total = discounted + fee;
    return {
      amt,
      fee,
      disc,
      discounted: Math.round(discounted * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [amount, serviceFee, discountPct]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pinoytambayanhub.com/" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://pinoytambayanhub.com/tools" },
      { "@type": "ListItem", position: 3, name: "E-load Calculator", item: "https://pinoytambayanhub.com/tools/eload" },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pinoytambayanhub.com/tools/eload" />
        <meta property="og:image" content="https://pinoytambayanhub.com/brand/og-card.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <link rel="canonical" href="https://pinoytambayanhub.com/tools/eload" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <section className="pt-20 max-w-3xl mx-auto px-4 text-lighttext">
        {/* Back to Tools */}
        <div className="mb-3">
          <Link href="/tools" className="text-sm text-gray-400 hover:text-blue-400">
            ← Back to Tools
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-3">📱 E-load Calculator</h1>
        <p className="text-gray-400 mb-6">
          Quickly compute your prepaid load cost including service fees and optional discounts (e.g., reseller margin).
        </p>

        <div className="card space-y-4">
          <label className="block">
            <span className="text-sm text-gray-300">Load Amount (₱)</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g., 50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md bg-gray-800/80 text-white px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-300">Service Fee (₱)</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g., 2"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              className="mt-1 w-full rounded-md bg-gray-800/80 text-white px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-300">Discount (%) — optional</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g., 5"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className="mt-1 w-full rounded-md bg-gray-800/80 text-white px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="rounded-lg bg-gray-800/60 border border-white/5 p-4 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Amount after discount</span>
              <span>₱{numbers.discounted.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Service fee</span>
              <span>₱{numbers.fee.toFixed(2)}</span>
            </div>
            <hr className="border-gray-700" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total to pay</span>
              <span className="text-blue-400">₱{numbers.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Note: Estimates only. For exact promo pricing, check official providers (Globe, Smart, DITO).
        </div>
      </section>
    </>
  );
}

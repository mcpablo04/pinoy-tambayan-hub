// pages/marketplace/index.tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

type Product = {
  id: string;
  title: string;
  category?: string;
  pricePhp?: number | null;
  rating?: number | null;
  store?: string | null;
  imageUrl: string;
  affiliateUrl: string;
  blurb?: string;
  ownerUid: string;
  ownerName?: string | null;
  complianceAck?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

// ✅ Read admin email from env and compare case-insensitively
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

export default function MarketplacePage() {
  const { user } = useAuth();
  const isAdmin = (user?.email?.toLowerCase() || "") === ADMIN_EMAIL;

  const [items, setItems] = useState<Product[]>([]);
  const [qStr, setQStr] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Product[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setItems(arr);
    });
    return () => unsub();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category || "Others")))],
    [items]
  );

  const filtered = useMemo(() => {
    const norm = (s: string) =>
      (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const qq = norm(qStr.trim());
    let out = items.filter((p) => {
      const inCat = cat === "All" || p.category === cat;
      const inQ =
        !qq ||
        [p.title, p.category, p.store, p.blurb, p.ownerName].some((f) =>
          norm(f || "").includes(qq)
        );
      const inPrice = maxPrice ? (p.pricePhp ?? Number.MAX_SAFE_INTEGER) <= maxPrice : true;
      return inCat && inQ && inPrice;
    });
    switch (sort) {
      case "price-asc":
        out = out.slice().sort((a, b) => (a.pricePhp ?? 9e15) - (b.pricePhp ?? 9e15));
        break;
      case "price-desc":
        out = out.slice().sort((a, b) => (b.pricePhp ?? -1) - (a.pricePhp ?? -1));
        break;
      default:
        out = out
          .slice()
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    }
    return out;
  }, [items, qStr, cat, sort, maxPrice]);

  async function onDelete(id: string) {
    if (!user) return;
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
  }

  return (
    <>
      <Head>
        <title>Marketplace • Pinoy Tambayan Hub</title>
        <meta
          name="description"
          content="Community-submitted affiliate picks for Pinoys — with search and filters."
        />
      </Head>

      <main className="container-page section">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="page-title">🛍️ Marketplace</h1>
          <div className="flex items-center gap-2">
            <Link href="/marketplace/new" className="btn btn-primary">
              Post a Product
            </Link>
          </div>
        </div>

        {/* Disclosure */}
        <div className="card mb-4 text-sm text-neutral-300">
          Disclosure: When you buy through links here, we may earn a small commission at no extra cost
          to you. Please submit only legal, safe, and policy-compliant products.
        </div>

        {/* Controls */}
        <section className="card mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">
                Search
              </label>
              <input
                value={qStr}
                onChange={(e) => setQStr(e.target.value)}
                className="input"
                placeholder="Search products, categories, stores…"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">
                Category
              </label>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="input">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">
                Sort
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="input"
              >
                <option value="new">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">
                Max Price (PHP)
              </label>
              <input
                type="number"
                min={0}
                value={maxPrice ?? ""}
                onChange={(e) =>
                  setMaxPrice(e.target.value ? Math.max(0, Number(e.target.value)) : undefined)
                }
                className="input"
                placeholder="e.g. 1500"
              />
            </div>
          </div>
        </section>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="card text-center text-neutral-300">
            No results. Try different keywords or filters.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const canDelete = !!user && (isAdmin || p.ownerUid === user.uid);
              return (
                <li key={p.id} className="card card-hover relative">
                  {/* Delete button (owner/admin only) */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="absolute right-2 top-2 z-20 rounded-md bg-red-600/90 text-white text-xs px-2 py-1 hover:bg-red-500"
                      title="Delete product"
                    >
                      Delete
                    </button>
                  )}

                  <a
                    href={p.affiliateUrl}
                    rel="nofollow sponsored noopener"
                    target="_blank"
                    className="block"
                    aria-label={`${p.title} – open affiliate link`}
                  >
                    {p.imageUrl && (
                      <div className="mb-3 overflow-hidden rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="aspect-[16/10] w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold leading-snug line-clamp-2">{p.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                        <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs">
                          {p.category || "Others"}
                        </span>
                        {p.store && <span className="text-xs text-neutral-400">via {p.store}</span>}
                      </div>
                      {p.blurb && <p className="text-sm text-neutral-300">{p.blurb}</p>}
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-lg font-semibold">{peso(p.pricePhp ?? undefined)}</div>
                        <div className="text-xs text-blue-400 underline-offset-4">Check price →</div>
                      </div>
                      <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                        Affiliate link. Price/availability may change—verify on merchant site.
                      </p>
                    </div>
                  </a>

                  {/* meta footer */}
                  <div className="mt-2 text-[11px] text-neutral-500">Posted by {p.ownerName || "User"}</div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

// pages/marketplace/index.tsx
"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  startAfter,
  deleteDoc,
  doc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import MetaHead from "../../components/MetaHead";

/* ===================== Toast (same style as profile) ===================== */
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 w-[min(90vw,340px)]">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    const hide = setTimeout(() => setShow(false), 2300);
    const done = setTimeout(onClose, 2600);
    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [onClose]);

  const tone =
    item.kind === "success"
      ? "bg-emerald-600/90 border-emerald-400/40"
      : item.kind === "error"
      ? "bg-red-600/90 border-red-400/40"
      : "bg-gray-800/90 border-white/10";

  const icon = item.kind === "success" ? "✅" : item.kind === "error" ? "⚠️" : "ℹ️";

  return (
    <div
      className={`pointer-events-auto rounded-lg border text-white shadow-xl backdrop-blur-sm px-3 py-2 text-sm transition-all duration-300
        ${tone} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden>{icon}</span>
        <div className="flex-1">{item.text}</div>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}

/* ===================== Confirm modal ===================== */
type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  resolve?: (ok: boolean) => void;
};

function ConfirmDialog({ state, setState }: { state: ConfirmState; setState: (s: ConfirmState) => void }) {
  const close = (ok: boolean) => {
    state.resolve?.(ok);
    setState({ ...state, open: false });
  };
  return (
    <div className={`fixed inset-0 z-[90] ${state.open ? "" : "pointer-events-none"}`} aria-hidden={!state.open}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${state.open ? "opacity-100" : "opacity-0"}`}
        onClick={() => close(false)}
      />
      <div
        className={`absolute inset-0 flex items-end sm:items-center justify-center p-4 transition-all duration-200
          ${state.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b0f19] p-5 shadow-2xl">
          <h3 className="text-lg font-semibold text-white">{state.title}</h3>
          <p className="mt-2 text-sm text-gray-300">{state.message}</p>
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <button
              onClick={() => close(false)}
              className="px-4 py-2 rounded-md border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => close(true)}
              className={`px-4 py-2 rounded-md text-white ${state.danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}
            >
              {state.confirmText ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function askConfirm(setState: (s: ConfirmState) => void, opts: Omit<ConfirmState, "open" | "resolve">) {
  return new Promise<boolean>((resolve) => setState({ ...opts, open: true, resolve }));
}

/* =============================== Page =============================== */
type Product = {
  id: string;
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
  complianceAck?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
const SITE = "https://pinoytambayanhub.com";
const PAGE_SIZE = 12;

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const isAdmin = (user?.email?.toLowerCase() || "") === ADMIN_EMAIL;

  const [items, setItems] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [qStr, setQStr] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  // toasts + confirm
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, text: string) =>
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), kind, text }]);
  const popToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "" });

  // initial load
  useEffect(() => {
    (async () => {
      await loadMore(true);
      setInitialLoading(false);

      // show toast if ?submitted=1
      if (typeof window !== "undefined" && window.location.search.includes("submitted=1")) {
        pushToast("success", "Thanks! Your product was submitted.");
        const url = new URL(window.location.href);
        url.searchParams.delete("submitted");
        window.history.replaceState({}, "", url.toString());
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore(initial = false) {
    if (loadingMore || (!initial && !hasMore)) return;
    setLoadingMore(true);
    try {
      let qRef = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        fsLimit(PAGE_SIZE)
      );
      if (lastDoc) {
        qRef = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          fsLimit(PAGE_SIZE)
        );
      }
      const snap = await getDocs(qRef);
      const page: Product[] = [];
      snap.forEach((d) => page.push({ id: d.id, ...(d.data() as any) }));
      setItems((prev) => (initial ? page : [...prev, ...page]));
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (e: any) {
      console.error(e);
      pushToast("error", e?.message || "Failed to load products.");
    } finally {
      setLoadingMore(false);
    }
  }

  // infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const ent = entries[0];
      if (ent.isIntersecting && hasMore && !loadingMore) {
        loadMore(false);
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category || "Others")))],
    [items]
  );

  const filtered = useMemo(() => {
    const norm = (s: string) => (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const qq = norm(qStr.trim());
    let out = items.filter((p) => {
      const inCat = cat === "All" || p.category === cat;
      const inQ = !qq || [p.title, p.category, p.store, p.blurb, p.ownerName].some((f) => norm(f || "").includes(qq));
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
        out = out.slice().sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    }
    return out;
  }, [items, qStr, cat, sort, maxPrice]);

  // cards w/ internal detail href for SEO
  const productCards = useMemo(
    () =>
      filtered.map((p) => {
        const pretty = p.slug && p.slug.length ? p.slug : slugify(p.title);
        return { ...p, href: `/marketplace/p/${p.id}-${pretty}` };
      }),
    [filtered]
  );

  async function onDelete(id: string) {
    if (!user) {
      pushToast("info", "Please sign in to delete your product.");
      return;
    }
    const ok = await askConfirm(setConfirm, {
      title: "Delete product?",
      message: "This product will be removed from the marketplace. This cannot be undone.",
      confirmText: "Delete product",
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "products", id));
      setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic update
      pushToast("success", "Product deleted.");
    } catch (e: any) {
      console.error(e);
      pushToast("error", e?.message || "Failed to delete product. Please try again.");
    }
  }

  // JSON-LD (ItemList) for the first 12 currently visible cards
  const jsonLd = useMemo(() => {
    const itemsForLd = productCards.slice(0, 12).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE}${p.href}`,
      name: p.title,
      image: p.imageUrl,
    }));
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: itemsForLd,
    };
  }, [productCards]);

  return (
    <>
      <MetaHead
        title="Marketplace • Pinoy Tambayan Hub"
        description="Community-submitted affiliate picks for Pinoys — browse, search, and filter."
        path="/marketplace"
      />
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      {/* Confirm + Toasts */}
      <ConfirmDialog state={confirm} setState={setConfirm} />
      <ToastViewport toasts={toasts} onClose={popToast} />

      <main className="container-page section">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="page-title">🛍️ Marketplace</h1>
          <div className="flex items-center gap-2">
            <Link href="/marketplace/new" className="btn btn-primary">
              Post a Product
            </Link>
          </div>
        </div>

        {/* Disclosure (submitter OR site may earn) */}
        <div className="card mb-4 text-sm text-neutral-300">
          Disclosure: Some links are affiliate links. A commission may go to the product submitter or to
          Pinoy Tambayan Hub. You never pay extra. Please submit only legal, safe, and policy-compliant
          products.
        </div>

        {/* Controls */}
        <section className="card mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">Search</label>
              <input
                value={qStr}
                onChange={(e) => setQStr(e.target.value)}
                className="input"
                placeholder="Search products, categories, stores…"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">Category</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="input">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="input">
                <option value="new">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-neutral-400 mb-1">Max Price (PHP)</label>
              <input
                type="number"
                min={0}
                value={maxPrice ?? ""}
                onChange={(e) => setMaxPrice(e.target.value ? Math.max(0, Number(e.target.value)) : undefined)}
                className="input"
                placeholder="e.g. 1500"
              />
            </div>
          </div>
        </section>

        {/* Results */}
        {initialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-48 animate-pulse bg-gray-800/60" />
            ))}
          </div>
        ) : productCards.length === 0 ? (
          <div className="card text-center text-neutral-300">No results. Try different keywords or filters.</div>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productCards.map((p) => {
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

                    {/* Card links to detail page for SEO */}
                    <Link href={p.href} className="block" aria-label={`${p.title} – details`}>
                      {p.imageUrl && (
                        <div className="mb-3 overflow-hidden rounded-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt={p.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold leading-snug line-clamp-2">{p.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                          <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs">{p.category || "Others"}</span>
                          {p.store && <span className="text-xs text-neutral-400">via {p.store}</span>}
                        </div>
                        {p.blurb && <p className="text-sm text-neutral-300 line-clamp-2">{p.blurb}</p>}
                      </div>
                    </Link>

                    {/* Footer: price + affiliate CTA */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-lg font-semibold">{peso(p.pricePhp ?? undefined)}</div>
                      <a
                        href={p.affiliateUrl}
                        rel="nofollow sponsored noopener"
                        target="_blank"
                        className="text-xs text-blue-400 underline-offset-4"
                      >
                        Check price →
                      </a>
                    </div>

                    <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                      Affiliate link (from the submitter or this site). Price/availability may change—verify on the merchant site.
                    </p>

                    <div className="mt-2 text-[11px] text-neutral-500">Posted by {p.ownerName || "User"}</div>
                  </li>
                );
              })}
            </ul>

            {/* Sentinel + fallback */}
            <div ref={sentinelRef} className="h-8" />
            <div className="mt-3 flex items-center justify-center">
              {loadingMore ? (
                <div className="text-sm text-neutral-400">Loading more…</div>
              ) : hasMore ? (
                <button
                  onClick={() => loadMore(false)}
                  className="px-4 py-2 rounded-md border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                >
                  Load more
                </button>
              ) : (
                <div className="text-sm text-neutral-500">You’ve reached the end.</div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

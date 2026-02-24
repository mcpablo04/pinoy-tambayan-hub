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
import Layout from "../../components/Layout";

/* ===================== Types ===================== */
type Product = {
  id: string;
  title: string;
  slug?: string | null;
  category?: string | null;
  pricePhp?: number | null;
  store?: string | null;
  imageUrl: string;
  affiliateUrl: string;
  blurb?: string | null;
  ownerUid: string;
  ownerName?: string | null;
  createdAt?: any;
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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
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

  // Filters
  const [qStr, setQStr] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");

  useEffect(() => {
    loadMore(true);
  }, []);

  async function loadMore(initial = false) {
    if (loadingMore || (!initial && !hasMore)) return;
    setLoadingMore(true);
    try {
      let qRef = query(collection(db, "products"), orderBy("createdAt", "desc"), fsLimit(PAGE_SIZE));
      if (!initial && lastDoc) {
        qRef = query(collection(db, "products"), orderBy("createdAt", "desc"), startAfter(lastDoc), fsLimit(PAGE_SIZE));
      }
      const snap = await getDocs(qRef);
      const page: Product[] = [];
      snap.forEach((d) => page.push({ id: d.id, ...(d.data() as any) }));
      
      setItems((prev) => (initial ? page : [...prev, ...page]));
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let out = items.filter((p) => {
      const inCat = cat === "All" || p.category === cat;
      const inQ = !qStr || p.title.toLowerCase().includes(qStr.toLowerCase());
      return inCat && inQ;
    });
    if (sort === "price-asc") out.sort((a, b) => (a.pricePhp || 0) - (b.pricePhp || 0));
    if (sort === "price-desc") out.sort((a, b) => (b.pricePhp || 0) - (a.pricePhp || 0));
    return out;
  }, [items, qStr, cat, sort]);

  return (
    <Layout title="Marketplace | Pinoy Tambayan Hub">
      <MetaHead title="Marketplace • Pinoy Tambayan" description="Community-submitted affiliate picks." />

      {/* HEADER SECTION */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              Community Market
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-white mt-6">
              The <span className="text-blue-500">Tiangge.</span>
            </h1>
          </div>
          <Link href="/marketplace/new" className="bg-white text-blue-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl text-center">
            + Post Product
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-md">
        <input 
          type="text" 
          placeholder="Search products..." 
          className="bg-[#0f172a] border border-white/10 rounded-xl px-6 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          onChange={(e) => setQStr(e.target.value)}
        />
        <select 
          className="bg-[#0f172a] border border-white/10 rounded-xl px-6 py-3 text-sm focus:outline-none focus:border-blue-500"
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home">Home</option>
        </select>
        <select 
          className="bg-[#0f172a] border border-white/10 rounded-xl px-6 py-3 text-sm focus:outline-none focus:border-blue-500"
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="new">Sort: Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {/* PRODUCTS GRID */}
      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-white/5 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((p) => (
            <div key={p.id} className="group bg-[#161e2d] border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all shadow-2xl flex flex-col">
              <Link href={`/marketplace/p/${p.id}-${slugify(p.title)}`} className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-blue-400 border border-white/10">
                  {p.category}
                </div>
              </Link>
              
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 min-h-[3.5rem]">
                  {p.title}
                </h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4">
                  via {p.store || 'Community'}
                </p>
                
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/5">
                  <span className="text-2xl font-black text-white italic">
                    {peso(p.pricePhp)}
                  </span>
                  <a 
                    href={p.affiliateUrl} 
                    target="_blank" 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Buy Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOAD MORE */}
      {hasMore && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => loadMore()} 
            disabled={loadingMore}
            className="border border-white/10 hover:bg-white/5 text-slate-400 px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Show More Items"}
          </button>
        </div>
      )}
    </Layout>
  );
}
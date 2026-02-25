"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import MetaHead from "../../components/MetaHead";
import Layout from "../../components/Layout";
import { Search, Filter, ArrowRight, ShoppingCart } from "lucide-react";

/* ===================== Types & Utils ===================== */
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
  createdAt?: any;
};

const peso = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
    : "—";

const PAGE_SIZE = 12;

function slugify(input: string) {
  return (input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // States for Search/Filter
  const [qStr, setQStr] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");

  // Load Initial Data
  useEffect(() => {
    loadProducts(true);
  }, []);

  async function loadProducts(initial = false) {
    if (loadingMore || (!initial && !hasMore)) return;
    setLoadingMore(true);
    
    try {
      // Base Query
      let qRef = query(
        collection(db, "products"), 
        orderBy("createdAt", "desc"), 
        fsLimit(PAGE_SIZE)
      );

      // Pagination Logic
      if (!initial && lastDoc) {
        qRef = query(
          collection(db, "products"), 
          orderBy("createdAt", "desc"), 
          startAfter(lastDoc), 
          fsLimit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(qRef);
      const newPage: Product[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      setItems(prev => (initial ? newPage : [...prev, ...newPage]));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error("Marketplace fetch error:", e);
    } finally {
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }

  // Client-side Filter (Works well for smaller catalogs)
  const displayItems = useMemo(() => {
    let out = [...items];
    if (cat !== "All") out = out.filter(p => p.category === cat);
    if (qStr) out = out.filter(p => p.title.toLowerCase().includes(qStr.toLowerCase()));
    
    if (sort === "price-asc") out.sort((a, b) => (a.pricePhp || 0) - (b.pricePhp || 0));
    if (sort === "price-desc") out.sort((a, b) => (b.pricePhp || 0) - (a.pricePhp || 0));
    
    return out;
  }, [items, qStr, cat, sort]);

  return (
    <Layout>
      <MetaHead title="Marketplace • Pinoy Hub" description="The best community-curated finds." />

      {/* HERO SECTION */}
      <section className="relative pt-10 pb-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.85]">
              The <span className="text-blue-600">Tiangge.</span>
            </h1>
            <p className="text-slate-500 mt-6 text-lg max-w-md font-medium">
              A curated collection of the best finds, submitted by our community.
            </p>
          </div>
          <Link href="/marketplace/new" className="group flex items-center gap-4 bg-white text-black p-2 pr-8 rounded-full hover:scale-105 transition-all">
            <div className="bg-blue-600 text-white p-4 rounded-full">
              <ShoppingCart size={20} />
            </div>
            <span className="font-black uppercase tracking-widest text-xs">Post Product</span>
          </Link>
        </div>
      </section>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-4 mb-12 p-2 bg-white/5 rounded-[2.5rem] border border-white/10">
        <div className="relative flex-grow">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full bg-slate-900 border-none rounded-[2rem] pl-16 pr-6 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-600"
            onChange={(e) => setQStr(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-slate-900 text-white border-none rounded-[2rem] px-8 py-4 text-xs font-black uppercase tracking-widest outline-none"
            onChange={(e) => setCat(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home</option>
          </select>
          <select 
            className="bg-slate-900 text-white border-none rounded-[2rem] px-8 py-4 text-xs font-black uppercase tracking-widest outline-none"
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="new">Latest</option>
            <option value="price-asc">₱ Low-High</option>
            <option value="price-desc">₱ High-Low</option>
          </select>
        </div>
      </div>

      {/* GRID */}
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-[3rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {displayItems.map((p) => (
            <div key={p.id} className="group relative flex flex-col bg-slate-900/50 rounded-[3rem] border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-500">
              <Link href={`/marketplace/p/${p.id}-${slugify(p.title)}`} className="block relative aspect-[4/5] overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                  {p.category || 'General'}
                </div>
              </Link>

              <div className="p-10 flex flex-col flex-grow">
                <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter text-white line-clamp-2">
                  {p.title}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-3xl font-black text-blue-500 italic">
                    {peso(p.pricePhp)}
                  </div>
                  <Link href={`/marketplace/p/${p.id}-${slugify(p.title)}`} className="text-white hover:text-blue-500 transition-colors">
                    <ArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NO RESULTS */}
      {!initialLoading && displayItems.length === 0 && (
        <div className="text-center py-40">
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No products found matching your search.</p>
        </div>
      )}

      {/* LOAD MORE */}
      {hasMore && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => loadProducts()} 
            disabled={loadingMore}
            className="group flex flex-col items-center gap-4 text-slate-500 hover:text-white transition-all"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Load More Content</span>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-blue-500 transition-colors">
              <div className={`w-1 h-1 bg-blue-500 rounded-full ${loadingMore ? 'animate-ping' : ''}`} />
            </div>
          </button>
        </div>
      )}
    </Layout>
  );
}
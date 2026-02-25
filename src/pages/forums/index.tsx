"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query as fsQuery,
  startAfter,
  where,
  DocumentSnapshot,
} from "firebase/firestore";
import ThreadItem from "../../components/Forum/ThreadItem";
import ForumLayout from "../../components/Forum/ForumLayout";
import Shoutbox from "../../components/Forum/Shoutbox";
import { Search, PlusCircle, MessageSquare } from "lucide-react";

const PAGE_SIZE = 12;

export default function ForumsHome() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [search, setSearch] = useState("");

  const category = (router.query.cat as string) || "all";

  const getQueryClauses = (startAtCursor?: DocumentSnapshot) => {
    const clauses: any[] = [];
    if (category !== "all") clauses.push(where("category", "==", category));
    clauses.push(orderBy("lastReplyAt", "desc"));
    clauses.push(orderBy("createdAt", "desc"));
    if (startAtCursor) clauses.push(startAfter(startAtCursor));
    clauses.push(fsLimit(PAGE_SIZE));
    return clauses;
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const clauses = getQueryClauses();
        const snap = await getDocs(fsQuery(collection(db, "threads"), ...clauses));
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCursor(snap.docs[snap.docs.length - 1] || null);
        setMore(snap.size === PAGE_SIZE);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    init();
  }, [category]);

  const loadMore = async () => {
    if (!cursor) return;
    const clauses = getQueryClauses(cursor);
    const snap = await getDocs(fsQuery(collection(db, "threads"), ...clauses));
    setThreads(p => [...p, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))]);
    setCursor(snap.docs[snap.docs.length - 1] || null);
    setMore(snap.size === PAGE_SIZE);
  };

  const filteredThreads = threads.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ForumLayout>
      <Head>
        <title>Forums — Pinoy Tambayan Hub</title>
      </Head>

      <Shoutbox />

      {/* STICKY HEADER SECTION - This fixes the 'broken' menu feel */}
      <div className="sticky top-0 z-40 bg-[#0b0f1a] border-b border-gray-800/60 pb-4 mb-6">
        <div className="pt-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..." 
              className="w-full bg-[#121722] border border-gray-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-100 focus:border-blue-500 outline-none transition-all shadow-inner"
            />
          </div>
          <Link href="/forums/new" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20 whitespace-nowrap">
            <PlusCircle size={18} /> <span className="text-sm">New Topic</span>
          </Link>
        </div>

        {/* Categories Bar - Pinned below search */}
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
          {["all", "general", "mobile", "web", "media", "tech", "gaming"].map(cat => (
            <Link 
              key={cat} 
              href={cat === "all" ? "/forums" : `/forums?cat=${cat}`}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                category === cat 
                ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                : 'bg-gray-800/40 border-gray-700/30 text-gray-400 hover:text-gray-100'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-[#121722] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="divide-y divide-gray-800/40">
          {loading ? (
             <div className="p-20 text-center flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mb-4"></div>
               <span className="text-gray-500 text-xs font-bold uppercase">Loading Discussions...</span>
             </div>
          ) : filteredThreads.length > 0 ? (
            filteredThreads.map(t => <ThreadItem key={t.id} t={t} />)
          ) : (
            <div className="p-20 text-center">
              <MessageSquare className="mx-auto mb-4 text-gray-700" size={32} />
              <p className="text-gray-500 text-sm italic">Nothing found here yet...</p>
            </div>
          )}
        </div>

        {more && !loading && (
          <button onClick={loadMore} className="w-full py-5 text-xs font-black tracking-widest text-blue-400 hover:bg-blue-500/5 transition-colors border-t border-gray-800 uppercase">
            Load More Topics
          </button>
        )}
      </div>
    </ForumLayout>
  );
}
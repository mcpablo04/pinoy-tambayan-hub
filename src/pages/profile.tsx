"use client";

import type { ChangeEvent } from "react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  User, BookOpen, MessageSquare, ShoppingBag, Settings, 
  LogOut, Camera, Trash2, ExternalLink, ShieldCheck, 
  ChevronRight, LayoutDashboard, CheckCircle2, AlertCircle
} from "lucide-react";

// Firebase & Auth
import { auth, db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";
import { reload } from "firebase/auth";
import { 
  doc, runTransaction, serverTimestamp, updateDoc, collection, 
  query, where, getDocs, collectionGroup, getCountFromServer, 
  limit as fsLimit, orderBy, deleteDoc, writeBatch, onSnapshot,
  type Timestamp, type Query as FsQuery, type CollectionReference, 
  type DocumentData, type FirestoreError 
} from "firebase/firestore";
import type { FirebaseError } from "firebase/app";

// Uploads & Components
import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";
import Skeleton from "../components/Skeleton";
import MetaHead from "../components/MetaHead";

/* --------------------------- TYPES --------------------------- */
type Tab = "overview" | "stories" | "forum" | "products" | "settings";
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };

type AnyProfile = {
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  createdAt?: { seconds: number; nanoseconds?: number } | null;
  usernameLower?: string | null;
  username?: string | null;
} | null;

type MyStory = { id: string; title: string; slug?: string | null; status?: "draft" | "published"; createdAt?: Timestamp; };
type MyThread = { id: string; title: string; category?: string | null; replyCount?: number; createdAt?: Timestamp; };
type MyProduct = { id: string; title: string; imageUrl: string; pricePhp?: number | null; createdAt?: Timestamp; };

/* --------------------------- UI COMPONENTS --------------------------- */

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed z-[100] bottom-6 right-6 flex flex-col gap-3 w-[min(90vw,340px)]">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`flex items-center gap-3 p-4 rounded-2xl border text-white shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-right-5 ${
            t.kind === 'success' ? 'bg-emerald-600/90 border-emerald-400/50' : 
            t.kind === 'error' ? 'bg-red-600/90 border-red-400/50' : 'bg-slate-800/90 border-white/10'
          }`}
        >
          {t.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-xs font-bold flex-1">{t.text}</p>
          <button onClick={() => onClose(t.id)} className="opacity-50 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- MAIN PAGE --------------------------- */

const INITIAL_LIMIT = 5;

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const router = useRouter();
  const p = (profile ?? null) as AnyProfile;

  // Tabs & State
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [name, setName] = useState<string>("");
  const [photo, setPhoto] = useState<string>("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  // Data Lists
  const [stories, setStories] = useState<MyStory[]>([]);
  const [threads, setThreads] = useState<MyThread[]>([]);
  const [products, setProducts] = useState<MyProduct[]>([]);
  
  // Counts
  const [counts, setCounts] = useState({ stories: 0, threads: 0, products: 0 });

  /* --------------------------- HELPERS --------------------------- */
  const pushToast = (kind: ToastKind, text: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, kind, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const toHandleBase = (name: string) => (name || "user").toLowerCase().replace(/[^a-z0-9._-]+/g, "").slice(0, 20);

  /* --------------------------- LOGIC --------------------------- */

  // Redirect & Sync
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (p) {
      setName(p.displayName ?? "");
      setPhoto(p.photoURL ?? "");
    }
  }, [loading, user, p, router]);

  // Load Stories & Counts
  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      const sq = query(collection(db, "stories"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"), fsLimit(INITIAL_LIMIT));
      const sSnap = await getDocs(sq);
      setStories(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as MyStory)));

      const tq = query(collection(db, "threads"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"), fsLimit(INITIAL_LIMIT));
      const tSnap = await getDocs(tq);
      setThreads(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as MyThread)));

      // Get Counts
      const sCount = await getCountFromServer(query(collection(db, "stories"), where("authorId", "==", user.uid)));
      const tCount = await getCountFromServer(query(collection(db, "threads"), where("authorId", "==", user.uid)));
      setCounts({ stories: sCount.data().count, threads: tCount.data().count, products: 0 });
    };

    loadData();
  }, [user?.uid]);

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    try {
      setUploadBusy(true);
      const blob: PutBlobResult = await upload(`avatars/${user.uid}/${f.name}`, f, { 
        access: "public", handleUploadUrl: "/api/avatar/upload" 
      });
      await updatePhotoURL(blob.url);
      await updateDoc(doc(db, "users", user.uid), { photoURL: blob.url, updatedAt: serverTimestamp() });
      setPhoto(blob.url);
      pushToast("success", "Avatar updated!");
    } catch (err) {
      pushToast("error", "Upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateDisplayName(name);
      await updateDoc(doc(db, "users", user.uid), { 
        displayName: name, 
        displayNameLower: name.toLowerCase(),
        updatedAt: serverTimestamp() 
      });
      pushToast("success", "Profile saved!");
    } catch (err) {
      pushToast("error", "Update failed.");
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black uppercase tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20">
      <MetaHead title="Profile Hub | Pinoy Tambayan" />
      <ToastViewport toasts={toasts} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* 🎭 HERO HEADER */}
      <div className="h-60 bg-gradient-to-b from-blue-600/20 to-transparent border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 📱 SIDEBAR */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-950 shadow-2xl bg-slate-800">
                  <img src={photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-4 border-slate-950">
                  <Camera size={16} className="text-white" />
                  <input type="file" className="hidden" onChange={onPickFile} disabled={uploadBusy} />
                </label>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">{p?.displayName || "Tambay"}</h1>
                <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">@{p?.username || "user"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-8">
                <div className="bg-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500">Stories</p>
                  <p className="text-xl font-black text-white">{counts.stories}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500">Threads</p>
                  <p className="text-xl font-black text-white">{counts.threads}</p>
                </div>
              </div>

              <button onClick={signOutApp} className="w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </aside>

          {/* 💻 MAIN CONTENT */}
          <main className="flex-1 space-y-6">
            <nav className="flex p-1 bg-slate-900 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar">
              {[
                { id: "overview", icon: LayoutDashboard, label: "Overview" },
                { id: "stories", icon: BookOpen, label: "Stories" },
                { id: "forum", icon: MessageSquare, label: "Forum" },
                { id: "settings", icon: Settings, label: "Settings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab.id ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-500 hover:text-white"
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </nav>

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-black text-white italic uppercase mb-8 flex items-center gap-3">
                  <Settings className="text-blue-500" /> Account Settings
                </h2>
                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* TAB: STORIES */}
            {activeTab === "stories" && (
              <div className="space-y-4 animate-in fade-in">
                {stories.map(s => (
                  <div key={s.id} className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                    <div>
                      <h3 className="text-white font-black italic uppercase text-lg">{s.title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status: <span className="text-emerald-500">{s.status}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/stories/${s.id}`} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><ExternalLink size={18} /></Link>
                    </div>
                  </div>
                ))}
                {stories.length === 0 && <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 font-black uppercase">No stories published yet.</div>}
              </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20">
                  <ShieldCheck size={40} className="mb-4 opacity-50" />
                  <h3 className="text-2xl font-black uppercase italic leading-none mb-2">Verified Member</h3>
                  <p className="text-blue-100 text-xs font-bold leading-relaxed">Your account is in good standing. You have full access to the radio, forums, and story publishing.</p>
                </div>
                <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem]">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/stories/new" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white font-bold text-sm">
                      Write new story <ChevronRight size={16} />
                    </Link>
                    <Link href="/forums/new" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white font-bold text-sm">
                      Start a discussion <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
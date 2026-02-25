"use client";

import type { ChangeEvent } from "react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  BookOpen, MessageSquare, Settings, 
  LogOut, Camera, ExternalLink, ShieldCheck, 
  ChevronRight, LayoutDashboard, CheckCircle2, AlertCircle,
  Loader2
} from "lucide-react";

import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { 
  doc, serverTimestamp, updateDoc, collection, 
  query, where, getDocs, getCountFromServer, 
  limit as fsLimit, orderBy, Timestamp 
} from "firebase/firestore";

import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";
import MetaHead from "../components/MetaHead";

/* --------------------------- TYPES --------------------------- */
type Tab = "overview" | "stories" | "forum" | "settings";
type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; text: string };

type MyStory = { id: string; title: string; status?: "draft" | "published"; createdAt?: Timestamp; };
type MyThread = { id: string; title: string; createdAt?: Timestamp; };

/* --------------------------- UI COMPONENTS --------------------------- */

function Toast({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed z-[100] bottom-8 right-8 flex flex-col gap-3 w-[min(90vw,320px)]">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`flex items-center gap-3 p-4 rounded-2xl border text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-10 duration-300 ${
            t.kind === 'success' ? 'bg-emerald-500/90 border-emerald-400/50' : 'bg-red-500/90 border-red-400/50'
          }`}
        >
          {t.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-[11px] font-black uppercase tracking-tight flex-1">{t.text}</p>
          <button onClick={() => onClose(t.id)} className="opacity-50 hover:opacity-100 transition-opacity">✕</button>
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

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [name, setName] = useState<string>("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [stories, setStories] = useState<MyStory[]>([]);
  const [threads, setThreads] = useState<MyThread[]>([]);
  const [counts, setCounts] = useState({ stories: 0, threads: 0 });

  const pushToast = (kind: ToastKind, text: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, kind, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const fmtDate = (ts?: Timestamp) => {
    if (!ts) return "Recently";
    return ts.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (profile) setName(profile.displayName || "");
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchData = async () => {
      try {
        const [sSnap, tSnap, sCount, tCount] = await Promise.all([
          getDocs(query(collection(db, "stories"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"), fsLimit(INITIAL_LIMIT))),
          getDocs(query(collection(db, "threads"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"), fsLimit(INITIAL_LIMIT))),
          getCountFromServer(query(collection(db, "stories"), where("authorId", "==", user.uid))),
          getCountFromServer(query(collection(db, "threads"), where("authorId", "==", user.uid)))
        ]);

        setStories(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as MyStory)));
        setThreads(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as MyThread)));
        setCounts({ stories: sCount.data().count, threads: tCount.data().count });
      } catch (e) { console.error("Data load error:", e); }
    };
    fetchData();
  }, [user?.uid]);

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (f.size > 2 * 1024 * 1024) return pushToast("error", "Image must be under 2MB");

    try {
      setUploadBusy(true);
      const blob: PutBlobResult = await upload(`avatars/${user.uid}`, f, { 
        access: "public", handleUploadUrl: "/api/avatar/upload" 
      });
      await updatePhotoURL(blob.url);
      await updateDoc(doc(db, "users", user.uid), { photoURL: blob.url, updatedAt: serverTimestamp() });
      pushToast("success", "Avatar synchronized!");
    } catch (err) {
      pushToast("error", "Failed to upload avatar.");
    } finally {
      setUploadBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !name.trim()) return;
    try {
      await updateDisplayName(name);
      await updateDoc(doc(db, "users", user.uid), { 
        displayName: name, 
        displayNameLower: name.toLowerCase(),
        updatedAt: serverTimestamp() 
      });
      pushToast("success", "Profile updated!");
    } catch (err) {
      pushToast("error", "Failed to save settings.");
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Establishing Connection</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20">
      <MetaHead title={`${profile?.displayName || 'Profile'} | Hub`} />
      <Toast toasts={toasts} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* 🎭 HERO HEADER */}
      <div className="h-64 bg-[#0a0f1d] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-[#020617]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* 📱 SIDEBAR */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 shadow-2xl">
              <div className="relative w-36 h-36 mx-auto mb-8 group">
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-slate-950 shadow-2xl bg-slate-800 transition-transform group-hover:scale-[1.02]">
                  <img 
                    src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} 
                    className={`w-full h-full object-cover transition-opacity ${uploadBusy ? 'opacity-30' : 'opacity-100'}`} 
                    alt="Profile" 
                  />
                  {uploadBusy && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-500 transition-all shadow-xl border-4 border-slate-950">
                  <Camera size={20} className="text-white" />
                  <input type="file" className="hidden" onChange={onPickFile} disabled={uploadBusy} accept="image/*" />
                </label>
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {profile?.displayName || "Tambay"}
                </h1>
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">
                  @{profile?.username || "anonymous"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-10">
                <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[1.5rem] text-center">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Stories</p>
                  <p className="text-2xl font-black text-white">{counts.stories}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[1.5rem] text-center">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Threads</p>
                  <p className="text-2xl font-black text-white">{counts.threads}</p>
                </div>
              </div>

              <button 
                onClick={signOutApp} 
                className="w-full mt-8 flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] border border-red-500/10 hover:bg-red-500 hover:text-white transition-all group"
              >
                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
              </button>
            </div>
          </aside>

          {/* 💻 MAIN CONTENT */}
          <main className="flex-1 space-y-8">
            <nav className="flex p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-x-auto no-scrollbar shadow-xl">
              {(["overview", "stories", "forum", "settings"] as const).map((id) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {id === "overview" && <LayoutDashboard size={14} />}
                  {id === "stories" && <BookOpen size={14} />}
                  {id === "forum" && <MessageSquare size={14} />}
                  {id === "settings" && <Settings size={14} />}
                  {id}
                </button>
              ))}
            </nav>

            <div className="min-h-[400px]">
              {/* TAB: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                    <ShieldCheck size={120} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic leading-none mb-3">Verified Member</h3>
                      <p className="text-blue-100 text-xs font-bold leading-relaxed max-w-[220px]">
                        Account is in good standing. You have full access to community privileges.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[3rem] shadow-xl">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Quick Navigation</h3>
                    <div className="space-y-4">
                      <Link href="/stories/new" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-blue-600 hover:border-blue-500 transition-all text-white font-black uppercase text-[10px] tracking-widest group">
                        Compose Story <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link href="/forum" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-blue-600 hover:border-blue-500 transition-all text-white font-black uppercase text-[10px] tracking-widest group">
                        Join Discussions <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: STORIES */}
              {activeTab === "stories" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  {stories.map(s => (
                    <div key={s.id} className="bg-slate-900/50 border border-white/5 p-7 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/50 transition-all shadow-lg">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${s.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {s.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{fmtDate(s.createdAt)}</span>
                        </div>
                        <h3 className="text-white font-black italic uppercase text-xl group-hover:text-blue-400 transition-colors">{s.title}</h3>
                      </div>
                      <Link href={`/stories/${s.id}`} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                        <ExternalLink size={20} />
                      </Link>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center">
                      <BookOpen size={48} className="text-slate-800 mb-4" />
                      <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No stories published yet.</p>
                      <Link href="/stories/new" className="mt-6 text-blue-500 font-black uppercase text-[10px] underline tracking-widest">Start Writing</Link>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: SETTINGS */}
              {activeTab === "settings" && (
                <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-10 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                  <div className="max-w-md">
                    <h2 className="text-2xl font-black text-white italic uppercase mb-10">Profile Settings</h2>
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">Global Display Name</label>
                        <input 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="What should we call you?"
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="pt-4">
                        <button 
                          onClick={handleSaveProfile} 
                          className="w-full sm:w-auto bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/20 active:scale-95 transition-all"
                        >
                          Sync Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
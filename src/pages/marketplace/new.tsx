"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import MetaHead from "../../components/MetaHead";
import { ArrowLeft, CheckCircle2, AlertCircle, Info, Image as ImageIcon } from "lucide-react";

/* ===== Refined Toast Types ===== */
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };

const CATEGORIES = ["Audio", "Wearables", "Chargers", "Streaming", "PC Parts", "Appliances", "Others"];

export default function NewProductPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", category: "Others", pricePhp: "", store: "",
    imageUrl: "", affiliateUrl: "", blurb: "",
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, text: string) =>
    setToasts((prev) => [...prev, { id: Date.now(), kind, text }]);

  useEffect(() => { router.prefetch("/marketplace"); }, [router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  function validUrl(u: string) { try { new URL(u); return true; } catch { return false; } }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      pushToast("info", "Log in required."); return;
    }
    if (!ack) {
      setError("Please acknowledge the content policy.");
      pushToast("error", "Policy agreement required."); return;
    }

    const title = form.title.trim();
    const imageUrl = form.imageUrl.trim();
    const affiliateUrl = form.affiliateUrl.trim();
    
    if (!title || !imageUrl || !affiliateUrl) {
      setError("Required fields: Title, Image, and Affiliate Link."); return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        ...form,
        title, imageUrl, affiliateUrl,
        pricePhp: form.pricePhp ? Math.max(0, Math.round(Number(form.pricePhp))) : null,
        ownerUid: user.uid,
        ownerName: profile?.displayName || user.displayName || user.email?.split('@')[0] || "Hub Member",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        complianceAck: true,
      });

      pushToast("success", "Item posted to the Tiangge! 🎉");
      setTimeout(() => router.push("/marketplace?submitted=1"), 800);
    } catch (err: any) {
      setError(err.message || "Failed to submit.");
      pushToast("error", "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20">
      <MetaHead title="Post to Tiangge • Hub" noindex />

      {/* TOAST VIEWPORT */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 
            ${t.kind === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
              t.kind === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
            {t.kind === 'success' ? <CheckCircle2 size={18}/> : t.kind === 'error' ? <AlertCircle size={18}/> : <Info size={18}/>}
            <span className="text-xs font-black uppercase tracking-widest">{t.text}</span>
          </div>
        ))}
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link href="/marketplace" className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Tiangge
            </Link>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Share a <span className="text-blue-600">Find.</span></h1>
          </div>
        </div>

        {!user ? (
          <div className="p-12 rounded-[3rem] bg-slate-900/50 border border-white/5 text-center">
            <p className="text-slate-400 font-medium mb-6">Join the community to post products.</p>
            <Link href="/login" className="inline-block bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">Login Now</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-8">
            {/* POLICY BOX */}
            <div className="p-8 rounded-[2.5rem] bg-blue-600/5 border border-blue-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                <ShieldCheck size={80} className="text-blue-500" />
              </div>
              <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Info size={14} /> Marketplace Rules
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                No illegal items, adult content, or misleading ads. Use only direct affiliate links from trusted stores. 
                Violations result in immediate removal.
              </p>
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="w-5 h-5 rounded-lg border-white/10 bg-slate-900 text-blue-600 focus:ring-blue-600 transition-all" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">I agree to follow the community guidelines</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Product Title</label>
                <input name="title" value={form.title} onChange={onChange} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-600 focus:ring-0 transition-all outline-none" placeholder="e.g. Sony WH-1000XM5" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Category</label>
                <select name="category" value={form.category} onChange={onChange} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-600 outline-none appearance-none cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Affiliate URL (Shopee/Lazada/Amazon)</label>
              <input name="affiliateUrl" value={form.affiliateUrl} onChange={onChange} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-600 transition-all outline-none" placeholder="https://..." required />
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Image URL</label>
                <input name="imageUrl" value={form.imageUrl} onChange={onChange} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-600 transition-all outline-none" placeholder="https://image-path.jpg" required />
              </div>
              
              <div className="aspect-video rounded-3xl bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center text-slate-700">
                {validUrl(form.imageUrl) ? (
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon size={32} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Image Preview</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Price (PHP)</label>
                <input name="pricePhp" type="number" value={form.pricePhp} onChange={onChange} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-600 transition-all outline-none" placeholder="1499" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Store Name</label>
                <input name="store" value={form.store} onChange={onChange} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-600 transition-all outline-none" placeholder="Shopee Mall" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Community Notes (Blurb)</label>
              <textarea name="blurb" value={form.blurb} onChange={onChange} rows={4} className="w-full bg-slate-900/50 border border-white/5 rounded-[2rem] px-8 py-6 text-white focus:border-blue-600 transition-all outline-none resize-none" placeholder="Why is this a great deal?" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl shadow-blue-600/20">
              {loading ? "Processing Submission..." : "Post Product to Tiangge"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

// Simple Helper for the icon used above
function ShieldCheck({ size, className }: { size: number, className: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>;
}
// pages/marketplace/new.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import MetaHead from "../../components/MetaHead";

/* ===== Toast (same as other pages) ===== */
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
/* ======================================= */

const CATEGORIES = ["Audio","Wearables","Chargers","Streaming","PC Parts","Appliances","Others"];

export default function NewProductPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", category: "", pricePhp: "", store: "",
    imageUrl: "", affiliateUrl: "", blurb: "",
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, text: string) =>
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), kind, text }]);
  const popToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => { router.prefetch("/marketplace"); }, [router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  function validUrl(u: string) { try { new URL(u); return true; } catch { return false; } }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      const msg = "Please log in to submit a product.";
      setError(msg); pushToast("info", msg); return;
    }
    if (!ack) {
      const msg = "You must confirm the AdSense/Content policy warning before submitting.";
      setError(msg); pushToast("error", msg); return;
    }

    const title = form.title.trim();
    const imageUrl = form.imageUrl.trim();
    const affiliateUrl = form.affiliateUrl.trim();
    const category = form.category || "Others";
    const pricePhp = form.pricePhp ? Math.max(0, Math.round(Number(form.pricePhp))) : null;
    const store = form.store?.trim() || null;
    const blurb = form.blurb?.trim() || "";

    if (!title || !imageUrl || !affiliateUrl) {
      const msg = "Title, Image URL, and Affiliate Link are required.";
      setError(msg); pushToast("error", msg); return;
    }
    if (!validUrl(imageUrl) || !validUrl(affiliateUrl)) {
      const msg = "Please provide valid URLs for Image and Affiliate Link.";
      setError(msg); pushToast("error", msg); return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        title, category, pricePhp, store, blurb,
        imageUrl, affiliateUrl,
        ownerUid: user.uid,
        ownerName: profile?.displayName || user.displayName || user.email || "User",
        complianceAck: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      pushToast("success", "Product posted! 🎉");
      setTimeout(() => router.push("/marketplace?submitted=1"), 400);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to submit. Please try again.";
      setError(msg); pushToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  const showImagePreview = validUrl(form.imageUrl);

  return (
    <>
      <MetaHead
  title="Submit a Product • Marketplace"
  description="Post your affiliate pick for the Pinoy Tambayan Hub marketplace."
  noindex
/>


      <ToastViewport toasts={toasts} onClose={popToast} />

      <main className="container-page section">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="page-title">Submit a Product</h1>
          <Link href="/marketplace" className="text-blue-400 underline-offset-4 hover:underline">
            ← Back to Marketplace
          </Link>
        </div>

        {!user ? (
          <div className="card">
            <p className="mb-3">Please log in to submit a product.</p>
            <Link href="/login" className="btn btn-primary">Login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4 max-w-2xl">
            {/* WARNING / POLICY ACK */}
            <div className="rounded-md border border-yellow-700/60 bg-yellow-950/30 p-3 text-sm leading-relaxed">
              <strong className="text-yellow-300">Heads up:</strong> Don’t submit illegal, unsafe, or misleading products,
              adult content, counterfeit items, or anything that violates merchant policies or Google AdSense content rules.
              Use only proper affiliate links. Submissions that break these rules may be removed and your account may be blocked.
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-1"
                required
              />
              <span>I understand and confirm my product complies with these rules.</span>
            </label>

            {error && (
              <div className="rounded-md bg-red-950/40 border border-red-700 p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Title *</label>
                <input name="title" value={form.title} onChange={onChange} className="input" required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Category</label>
                <select name="category" value={form.category} onChange={onChange} className="input">
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Affiliate Link *</label>
                <input name="affiliateUrl" value={form.affiliateUrl} onChange={onChange} className="input" placeholder="https://..." required />
                <p className="mt-1 text-xs text-gray-400">We add <code>rel="sponsored nofollow"</code> automatically.</p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Image URL *</label>
                <input name="imageUrl" value={form.imageUrl} onChange={onChange} className="input" placeholder="https://example.com/image.jpg" required />
                {showImagePreview && (
                  <div className="mt-2 w-full overflow-hidden rounded border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Preview" className="w-full h-36 object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Price (PHP)</label>
                <input name="pricePhp" value={form.pricePhp} onChange={onChange} className="input" type="number" min={0} placeholder="e.g. 1499" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Store</label>
                <input name="store" value={form.store} onChange={onChange} className="input" placeholder="Shopee/Lazada/Amazon…" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Quick notes (blurb)</label>
              <textarea name="blurb" value={form.blurb} onChange={onChange} className="input" rows={4} placeholder="Why this is a good pick for Pinoys…"></textarea>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn btn-primary" disabled={loading}>{loading ? "Submitting…" : "Post product"}</button>
              <Link href="/marketplace" className="btn btn-ghost">Cancel</Link>
            </div>
          </form>
        )}
      </main>
    </>
  );
}

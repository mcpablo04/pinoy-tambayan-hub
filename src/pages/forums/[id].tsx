"use client";

import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  doc,
  increment,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import CommentItem, { Comment } from "../../components/Forum/Comment";
import ForumLayout from "../../components/Forum/ForumLayout";
import WidgetCard from "../../components/Forum/WidgetCard";
import CategoryPill from "../../components/Forum/CategoryPill";
import { formatDistanceToNow } from "date-fns";
import { Share2, ArrowLeft, Plus, MessageSquare } from "lucide-react";

const ADMIN_EMAIL = "markcidricpablo@gmail.com";

export default function ThreadDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { user, profile } = useAuth();
  const [thread, setThread] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [featured, setFeatured] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!thread) return;
    if (navigator.share) {
      try { await navigator.share({ title: thread.title, url: window.location.href }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  useEffect(() => {
    (async () => {
      const featSnap = await getDocs(query(collection(db, "threads"), orderBy("replyCount", "desc"), fsLimit(5)));
      setFeatured(featSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    const unsubT = onSnapshot(doc(db, "threads", id), (s) => {
      setThread(s.exists() ? { id: s.id, ...s.data() } : null);
      setLoading(false);
    });
    const unsubC = onSnapshot(query(collection(db, "threads", id, "comments"), orderBy("createdAt", "asc")), (s) => {
      setComments(s.docs.map(d => ({ id: d.id, ...d.data() })) as any);
    });
    return () => { unsubT(); unsubC(); };
  }, [id]);

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !text.trim() || busy) return;
    setBusy(true);
    try {
      await addDoc(collection(db, "threads", id, "comments"), {
        body: text.trim(),
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "User",
        authorPhoto: profile?.photoURL || user.photoURL || "",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "threads", id), {
        replyCount: increment(1),
        lastReplyAt: serverTimestamp(),
      });
      setText("");
      toast.success("Reply posted");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) { toast.error("Failed to post"); }
    finally { setBusy(false); }
  };

  if (loading) return <ForumLayout><div className="animate-pulse h-64 bg-gray-800/10 rounded-2xl" /></ForumLayout>;
  if (!thread) return <ForumLayout><div className="p-20 text-center text-gray-500 italic">This thread has vanished into the void.</div></ForumLayout>;

  return (
    <ForumLayout
      rightRail={
        <WidgetCard title="Trending">
          <div className="space-y-4">
            {featured.map(t => (
              <Link key={t.id} href={`/forums/${t.id}`} className="block group">
                <p className="text-xs text-gray-300 group-hover:text-blue-400 line-clamp-2 transition-colors">{t.title}</p>
                <span className="text-[10px] text-gray-600 font-bold uppercase">{t.replyCount || 0} replies</span>
              </Link>
            ))}
          </div>
        </WidgetCard>
      }
    >
      <Head><title>{thread.title}</title></Head>

      {/* STICKY TOP NAVIGATION - Z-index is critical here */}
      <div className="sticky top-0 z-50 bg-[#0b0f1a] pt-4 pb-2 border-b border-gray-800/50 mb-6 flex items-center justify-between">
        <Link href="/forums" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={16} /> <span className="text-xs font-black tracking-widest uppercase">Feed</span>
        </Link>
        <div className="flex gap-2">
           <button onClick={handleShare} className="p-2 bg-gray-800 rounded-xl border border-gray-700 text-gray-400 hover:text-white"><Share2 size={16} /></button>
           <Link href="/forums/new" className="bg-blue-600 px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">NEW</Link>
        </div>
      </div>

      <article className="bg-[#121722] border border-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-800 relative overflow-hidden border border-gray-700">
            {thread.authorPhoto && <Image src={thread.authorPhoto} alt="" fill className="object-cover" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-100">{thread.authorName}</span>
              {user?.email === ADMIN_EMAIL && <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Admin</span>}
            </div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
              {thread.createdAt ? formatDistanceToNow(new Date(thread.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
            </span>
          </div>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-white mb-6 leading-[1.15] tracking-tight">{thread.title}</h1>
        <div className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-8">{thread.body}</div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-800/50">
          <CategoryPill cat={thread.category} />
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1.5"><MessageSquare size={14} /> <span className="text-xs font-bold">{comments.length}</span></div>
          </div>
        </div>
      </article>

      <div className="space-y-6 mb-24">
        {comments.map(c => <CommentItem key={c.id} c={c} canDelete={user?.email === ADMIN_EMAIL || user?.uid === c.authorId} />)}
        <div ref={endRef} />
      </div>

      {/* FLOATING REPLY BOX - Fixed at bottom for best mobile UX */}
      <div className="sticky bottom-4 z-40 px-2">
        {user ? (
          <form onSubmit={postComment} className="bg-[#1b202b] border border-blue-500/30 p-4 rounded-2xl shadow-2xl shadow-black/80">
            <textarea 
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Write something thoughtful..."
              className="w-full bg-transparent border-none focus:ring-0 text-gray-100 text-sm resize-none h-20"
            />
            <div className="flex justify-end mt-2 pt-2 border-t border-gray-800/50">
              <button disabled={busy || !text.trim()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-30 transition-all">
                {busy ? "POSTING..." : "POST REPLY"}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center text-xs font-bold text-gray-500 tracking-widest uppercase">
            Sign in to join the discussion
          </div>
        )}
      </div>
    </ForumLayout>
  );
}
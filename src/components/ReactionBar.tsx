"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export type NotifyKind = "success" | "error" | "info";
export type Notify = (kind: NotifyKind, text: string) => void;

type ReactionType = "heart" | "like" | "fire" | "sad" | "wow";

const REACTIONS: { key: ReactionType; label: string; icon: string; color: string }[] = [
  { key: "heart", label: "Love", icon: "❤️", color: "bg-pink-500/20 text-pink-500 border-pink-500/30" },
  { key: "like",  label: "Like", icon: "👍", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
  { key: "fire",  label: "Fire", icon: "🔥", color: "bg-orange-500/20 text-orange-500 border-orange-500/30" },
  { key: "sad",   label: "Sad",  icon: "😢", color: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30" },
  { key: "wow",   label: "Wow",  icon: "😮", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
];

type Props = {
  storyId: string;
  compact?: boolean;
  notify?: Notify;
};

export default function ReactionBar({ storyId, compact = false, notify }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [mine, setMine] = useState<ReactionType | null>(null);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    heart: 0, like: 0, fire: 0, sad: 0, wow: 0,
  });

  useEffect(() => {
    const ref = collection(db, "stories", storyId, "reactions");
    return onSnapshot(ref, (snap) => {
      const c: Record<ReactionType, number> = { heart: 0, like: 0, fire: 0, sad: 0, wow: 0 };
      let my: ReactionType | null = null;
      snap.forEach((d) => {
        const t = (d.data()?.type ?? "") as ReactionType;
        if (REACTIONS.some(r => r.key === t)) c[t] = (c[t] || 0) + 1;
        if (user?.uid && d.id === user.uid) my = t || null;
      });
      setCounts(c);
      setMine(my);
    });
  }, [storyId, user?.uid]);

  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  const toggle = async (t: ReactionType) => {
    if (busy) return;
    if (!user?.uid) {
      const next = encodeURIComponent(router.asPath);
      router.push(`/login?next=${next}`);
      return;
    }

    // Optimistic UI update
    const previousMine = mine;
    const isRemoving = mine === t;
    
    setBusy(true);
    setMine(isRemoving ? null : t);

    const myRef = doc(db, "stories", storyId, "reactions", user.uid);

    try {
      if (isRemoving) {
        await deleteDoc(myRef);
      } else {
        await setDoc(myRef, { type: t, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (e: any) {
      setMine(previousMine); // Rollback on error
      notify?.("error", "Action failed. Check connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mt-6 py-4 border-y border-white/5"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {REACTIONS.map((r) => {
          const active = mine === r.key;
          return (
            <motion.button
              key={r.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(r.key)}
              className={`
                relative flex items-center gap-2 rounded-2xl border transition-all duration-300
                ${compact ? "px-3 py-1.5" : "px-4 py-2"}
                ${active 
                  ? `${r.color} shadow-lg shadow-current/10 border-current` 
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className={compact ? "text-lg" : "text-xl"}>{r.icon}</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={counts[r.key]}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-black tabular-nums"
                >
                  {counts[r.key] || 0}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {!compact && total > 0 && (
        <div className="ml-auto hidden sm:flex items-center gap-2">
           <div className="flex -space-x-2">
              {REACTIONS.filter(r => counts[r.key] > 0).slice(0, 3).map(r => (
                <span key={r.key} className="text-xs">{r.icon}</span>
              ))}
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
             {total} {total === 1 ? 'Reaction' : 'Reactions'}
           </span>
        </div>
      )}
    </div>
  );
}
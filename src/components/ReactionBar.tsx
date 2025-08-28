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
import { db } from "../firebase/clientApp";
import { useAuth } from "../context/AuthContext";

export type NotifyKind = "success" | "error" | "info";
export type Notify = (kind: NotifyKind, text: string) => void;

type ReactionType = "heart" | "like" | "fire" | "sad" | "wow";

const REACTIONS: { key: ReactionType; label: string; icon: string }[] = [
  { key: "heart", label: "Love", icon: "❤️" },
  { key: "like",  label: "Like", icon: "👍" },
  { key: "fire",  label: "Fire", icon: "🔥" },
  { key: "sad",   label: "Sad",  icon: "😢" },
  { key: "wow",   label: "Wow",  icon: "😮" },
];

type Props = {
  storyId: string;
  compact?: boolean;
  /** Optional toast hook from the page */
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

  // Live counts + my reaction
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

  const goLogin = () => {
    const next = encodeURIComponent(router.asPath || `/stories/${storyId}`);
    router.push(`/login?next=${next}`);
  };

  const toggle = async (t: ReactionType) => {
    if (busy) return;
    if (!user?.uid) return goLogin();

    setBusy(true);
    const myRef = doc(db, "stories", storyId, "reactions", user.uid);

    try {
      if (mine === t) {
        await deleteDoc(myRef);
        notify?.("success", "Reaction removed.");
      } else {
        try {
          await updateDoc(myRef, { type: t });
          notify?.("success", "Reaction updated.");
        } catch {
          await setDoc(myRef, { type: t, createdAt: serverTimestamp() });
          notify?.("success", "Reaction added.");
        }
      }
    } catch (e: any) {
      notify?.("error", e?.code === "permission-denied" ? "You don't have permission to react." : "Failed to react.");
    } finally {
      setBusy(false);
    }
  };

  // Blue active state + mobile-friendly tap targets
  const size = compact ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm sm:text-base";
  const baseBtn =
    "inline-flex items-center justify-center rounded-full border transition " +
    "bg-white/5 text-gray-200 border-white/10 hover:bg-white/10 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
    "min-w-[48px] " + size;

  return (
    <div role="toolbar" aria-label="Story reactions" className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-4"}`}>
      {REACTIONS.map((r) => {
        const active = mine === r.key;
        return (
          <button
            key={r.key}
            onClick={() => toggle(r.key)}
            disabled={busy}
            aria-pressed={active}
            aria-label={`${r.label} (${counts[r.key] || 0})`}
            className={`${baseBtn} ${active ? "bg-blue-600 text-white border-blue-500" : ""} ${busy ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <span className={compact ? "mr-1 text-[17px]" : "mr-1 text-[19px]"}>{r.icon}</span>
            <span className="font-medium tabular-nums">{counts[r.key] || 0}</span>
          </button>
        );
      })}
      {!compact && <span className="basis-full sm:basis-auto sm:ml-2 text-sm text-gray-400">Total: {total}</span>}
    </div>
  );
}

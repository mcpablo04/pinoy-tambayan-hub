"use client";

import { useEffect, useMemo, useState } from "react";
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

type ReactionType = "heart" | "like" | "fire" | "sad" | "wow";

const REACTIONS: { key: ReactionType; label: string; icon: string }[] = [
  { key: "heart", label: "Love", icon: "❤️" },
  { key: "like",  label: "Like", icon: "👍" },
  { key: "fire",  label: "Fire", icon: "🔥" },
  { key: "sad",   label: "Sad",  icon: "😢" },
  { key: "wow",   label: "Wow",  icon: "😮" },
];

export default function ReactionBar({
  storyId,
  compact = false,
}: {
  storyId: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [mine, setMine] = useState<ReactionType | null>(null);
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
        if (REACTIONS.find(r => r.key === t)) c[t] = (c[t] || 0) + 1;
        if (user?.uid && d.id === user.uid) my = t || null;
      });
      setCounts(c);
      setMine(my);
    });
  }, [storyId, user?.uid]);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const toggle = async (t: ReactionType) => {
    if (!user?.uid) return alert("Please log in to react.");

    const myRef = doc(db, "stories", storyId, "reactions", user.uid);

    if (mine === t) {
      await deleteDoc(myRef);
      return;
    }

    try {
      await updateDoc(myRef, { type: t });
    } catch {
      await setDoc(myRef, { type: t, createdAt: serverTimestamp() });
    }
  };

  // 👇 fixed/min width so the button won’t shrink as counts change
  const btnBase =
    "border transition rounded-full flex items-center justify-center " +
    (compact ? "h-8 px-2 text-xs min-w-[44px]" : "px-3 py-1.5 text-sm min-w-[56px]");

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mt-6"}`}>
      {REACTIONS.map((r) => {
        const active = mine === r.key;
        return (
          <button
            key={r.key}
            onClick={() => toggle(r.key)}
            className={`${btnBase} ${
              active
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-white/5 text-gray-200 border-white/10 hover:bg-white/10"
            }`}
            title={r.label}
          >
            <span className={compact ? "mr-1" : "mr-1 text-base"}>{r.icon}</span>
            {counts[r.key] || 0}
          </button>
        );
      })}
      {!compact && (
        <span className="ml-2 text-sm text-gray-400">Total: {total}</span>
      )}
    </div>
  );
}

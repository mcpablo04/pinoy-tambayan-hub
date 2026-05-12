"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   TYPES
   ============================================================ */
export type NotifyKind = "success" | "error" | "info";
export type Notify = (kind: NotifyKind, text: string) => void;
export type ReactionType = "heart" | "like" | "fire" | "sad" | "wow";

type ReactionCounts = Record<ReactionType, number>;

/* ============================================================
   CONSTANTS
   ============================================================ */
const REACTIONS: { key: ReactionType; label: string; icon: string; color: string }[] = [
  { key: "heart", label: "Love", icon: "❤️", color: "bg-pink-500/20 text-pink-500 border-pink-500/30" },
  { key: "like",  label: "Like", icon: "👍", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
  { key: "fire",  label: "Fire", icon: "🔥", color: "bg-orange-500/20 text-orange-500 border-orange-500/30" },
  { key: "sad",   label: "Sad",  icon: "😢", color: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30" },
  { key: "wow",   label: "Wow",  icon: "😮", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
];

const EMPTY_COUNTS: ReactionCounts = { heart: 0, like: 0, fire: 0, sad: 0, wow: 0 };

/* ============================================================
   HELPERS
   ============================================================ */

/** Apply an optimistic counts change before Firestore confirms */
function applyOptimisticCounts(
  counts: ReactionCounts,
  prev: ReactionType | null,
  next: ReactionType | null
): ReactionCounts {
  const updated = { ...counts };
  if (prev) updated[prev] = Math.max(0, updated[prev] - 1);
  if (next) updated[next] = (updated[next] || 0) + 1;
  return updated;
}

/* ============================================================
   PROPS
   ============================================================ */
type Props = {
  storyId: string;
  compact?: boolean;
  notify?: Notify;
};

/* ============================================================
   COMPONENT
   ============================================================ */
export default function ReactionBar({ storyId, compact = false, notify }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  // The reaction the current user has selected (null = none)
  const [mine, setMine] = useState<ReactionType | null>(null);

  // Live counts from Firestore
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS);

  // Prevent double-clicks while a Firestore write is in-flight
  const [busy, setBusy] = useState(false);

  const storyIdRef = useRef(storyId);
  storyIdRef.current = storyId;

  /* ----------------------------------------------------------
     REALTIME LISTENER
     Listens to the reactions subcollection and tallies counts.
     Excludes user?.uid from deps so the listener doesn't
     restart on every auth state change.
  ---------------------------------------------------------- */
  useEffect(() => {
    const reactionsRef = collection(db, "stories", storyId, "reactions");

    const unsubscribe = onSnapshot(reactionsRef, (snap) => {
      const tallied = { ...EMPTY_COUNTS };
      let myReaction: ReactionType | null = null;

      snap.forEach((docSnap) => {
        const type = docSnap.data()?.type as ReactionType | undefined;
        const isValid = type && REACTIONS.some((r) => r.key === type);

        if (isValid) {
          tallied[type] = (tallied[type] || 0) + 1;
          if (user?.uid && docSnap.id === user.uid) {
            myReaction = type;
          }
        }
      });

      setCounts(tallied);
      setMine(myReaction);
    });

    return () => unsubscribe();
  }, [storyId]); // Only re-subscribe when storyId changes

  /* ----------------------------------------------------------
     TOTAL REACTION COUNT
  ---------------------------------------------------------- */
  const total = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts]
  );

  /* ----------------------------------------------------------
     TOGGLE REACTION

     3 possible actions:
     ┌─────────────────────────────────────────────────────┐
     │ REMOVE   → user clicks their current reaction       │
     │            delete reaction doc, decrement count     │
     │                                                     │
     │ SWITCH   → user clicks a different reaction         │
     │            update reaction doc only, count same     │
     │            (no story doc update needed)             │
     │                                                     │
     │ ADD      → user has no reaction, clicks one         │
     │            create reaction doc, increment count     │
     └─────────────────────────────────────────────────────┘
  ---------------------------------------------------------- */
  const toggle = async (selected: ReactionType) => {
    if (busy) return;

    // Redirect to login if not authenticated
    if (!user?.uid) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    const isRemoving  = mine === selected;            // same emoji clicked → remove
    const isSwitching = mine !== null && !isRemoving; // different emoji → switch

    const prevReaction = mine;
    const nextReaction = isRemoving ? null : selected;

    // Optimistic UI — update instantly before Firestore confirms
    setBusy(true);
    setMine(nextReaction);
    setCounts((prev) => applyOptimisticCounts(prev, prevReaction, nextReaction));

    const reactionDocRef = doc(db, "stories", storyId, "reactions", user.uid);
    const storyDocRef    = doc(db, "stories", storyId);

    try {
      if (isSwitching) {
        // SWITCH: only update the reaction doc.
        // The story's total count doesn't change, so we skip touching
        // the story doc entirely — this avoids a Firestore rules "verify"
        // check on the story doc that would cause a permission error.
        await setDoc(reactionDocRef, {
          type: selected,
          updatedAt: serverTimestamp(),
        });

      } else {
        // ADD or REMOVE: use a transaction so the reaction doc and
        // story count update atomically (no partial writes)
        await runTransaction(db, async (tx) => {
          const storySnap = await tx.get(storyDocRef);
          if (!storySnap.exists()) throw new Error("Story not found");

          const currentTotal = storySnap.data().counts?.reactions ?? 0;

          if (isRemoving) {
            // Delete the reaction doc and decrement the story count
            tx.delete(reactionDocRef);
            tx.update(storyDocRef, {
              "counts.reactions": Math.max(0, currentTotal - 1),
              updatedAt: serverTimestamp(),
            });
          } else {
            // Create the reaction doc and increment the story count
            tx.set(reactionDocRef, { type: selected, updatedAt: serverTimestamp() });
            tx.update(storyDocRef, {
              "counts.reactions": currentTotal + 1,
              updatedAt: serverTimestamp(),
            });
          }
        });
      }

    } catch (err) {
      console.error("Reaction toggle error:", err);

      // Rollback optimistic UI on failure
      setMine(prevReaction);
      setCounts((prev) => applyOptimisticCounts(prev, nextReaction, prevReaction));

      notify?.("error", "Could not save reaction. Please try again.");

    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mt-6 py-4 border-y border-white/5"}`}>

      {/* Reaction Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {REACTIONS.map((reaction) => {
          const isActive = mine === reaction.key;
          const count = counts[reaction.key] || 0;

          return (
            <motion.button
              key={reaction.key}
              whileHover={{ scale: busy ? 1 : 1.05 }}
              whileTap={{ scale: busy ? 1 : 0.9 }}
              onClick={() => toggle(reaction.key)}
              disabled={busy}
              aria-label={`${reaction.label} reaction (${count})`}
              aria-pressed={isActive}
              className={`
                relative flex items-center gap-2 rounded-2xl border transition-all duration-200
                ${compact ? "px-3 py-1.5" : "px-4 py-2"}
                ${busy ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                ${isActive
                  ? `${reaction.color} shadow-lg border-current`
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className={compact ? "text-lg" : "text-xl"}>
                {reaction.icon}
              </span>

              <AnimatePresence mode="wait">
                <motion.span
                  key={count}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs font-black tabular-nums min-w-[12px] text-center"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Total Reactions Summary (non-compact only) */}
      {!compact && total > 0 && (
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <div className="flex -space-x-1">
            {REACTIONS
              .filter((r) => counts[r.key] > 0)
              .slice(0, 3)
              .map((r) => (
                <span key={r.key} className="text-sm">{r.icon}</span>
              ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {total} {total === 1 ? "Reaction" : "Reactions"}
          </span>
        </div>
      )}

    </div>
  );
}
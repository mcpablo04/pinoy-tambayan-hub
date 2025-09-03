"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export type Comment = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt?: any; // Timestamp | {seconds,nanoseconds} | string | number | FieldValue
};

// Turn Firestore timestamp-like values into a valid Date (or null)
function toValidDate(ts: any): Date | null {
  if (!ts) return null;

  try {
    // Firestore Timestamp
    if (typeof ts?.toDate === "function") {
      const d = ts.toDate();
      return isNaN(d.getTime()) ? null : d;
    }

    // seconds/nanoseconds object
    if (typeof ts?.seconds === "number") {
      const ms = ts.seconds * 1000 + Math.floor((ts.nanoseconds ?? 0) / 1e6);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }

    // JS date-compatible values
    if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;
    if (typeof ts === "number" || typeof ts === "string") {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

export default function CommentItem({
  c,
  canDelete,
  onDelete,
}: {
  c: Comment;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  const created = toValidDate(c.createdAt);
  const ago = created ? formatDistanceToNow(created, { addSuffix: true }) : "just now";

  return (
    <article
      className="rounded-2xl bg-[#1b202b] border border-gray-800 p-4"
      aria-label={`Comment by ${c.authorName || "User"}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
          {c.authorPhoto ? (
            <Image
              src={c.authorPhoto}
              alt={c.authorName || "User"}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400 text-xs">
              {(c.authorName || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-200 truncate">{c.authorName || "User"}</span>
            {created ? (
              <time className="text-gray-500 shrink-0" dateTime={created.toISOString()}>
                · {ago}
              </time>
            ) : (
              <span className="text-gray-500 shrink-0">· {ago}</span>
            )}
          </div>

          <p className="mt-1 text-gray-200 whitespace-pre-wrap break-words">
            {c.body}
          </p>
        </div>

        {/* Actions */}
        {canDelete && (
          <button
            onClick={() => onDelete?.(c.id)}
            className="ml-2 text-xs px-2 py-1 rounded-md border border-red-700 text-red-300 hover:bg-red-900/30 focus:outline-none focus:ring-1 focus:ring-red-600"
            aria-label="Delete comment"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

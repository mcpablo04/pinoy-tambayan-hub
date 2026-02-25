"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

export type Comment = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt?: any;
};

function toValidDate(ts: any): Date | null {
  if (!ts) return null;
  try {
    if (typeof ts?.toDate === "function") {
      const d = ts.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof ts?.seconds === "number") {
      const ms = ts.seconds * 1000 + Math.floor((ts.nanoseconds ?? 0) / 1e6);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;
    if (typeof ts === "number" || typeof ts === "string") {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    }
  } catch (_) {}
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
      className="group relative flex gap-4 p-2 transition-all duration-200"
      aria-label={`Comment by ${c.authorName || "User"}`}
    >
      {/* Left Column: Avatar + Thread Line */}
      <div className="flex flex-col items-center">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-800 group-hover:border-blue-500/50 transition-colors flex-shrink-0 shadow-lg">
          {c.authorPhoto ? (
            <Image
              src={c.authorPhoto}
              alt={c.authorName || "User"}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-blue-400 font-bold text-sm bg-blue-500/10">
              {(c.authorName || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        {/* Subtle vertical line connecting comments */}
        <div className="w-px h-full bg-gray-800 mt-2 group-last:hidden" />
      </div>

      {/* Right Column: Content Bubble */}
      <div className="flex-1 min-w-0">
        <div className="bg-[#1b202b] border border-gray-800 rounded-2xl p-4 shadow-sm hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-100 text-sm hover:text-blue-400 cursor-pointer transition-colors">
                {c.authorName || "User"}
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {ago}
              </span>
            </div>

            {/* Actions: Only visible on hover for a cleaner look */}
            {canDelete && (
              <button
                onClick={() => onDelete?.(c.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                aria-label="Delete comment"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <p className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {c.body}
          </p>
        </div>
      </div>
    </article>
  );
}
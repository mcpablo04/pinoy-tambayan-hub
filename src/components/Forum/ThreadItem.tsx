"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export type Thread = {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
  replyCount?: number;
  lastReplyAt?: { seconds: number; nanoseconds: number };
};

function tsToDate(ts?: { seconds: number; nanoseconds: number }) {
  return ts ? new Date(ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6)) : undefined;
}

export default function ThreadItem({ t }: { t: Thread }) {
  const created = tsToDate(t.createdAt);
  const ago = created ? formatDistanceToNow(created, { addSuffix: true }) : "just now";
  const tagList = (t.tags || []).slice(0, 3);

  return (
    <Link
      href={`/forums/${t.id}`}
      className="block rounded-2xl bg-[#1f2430] border border-gray-800 p-4 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
          {t.authorPhoto ? (
            <Image src={t.authorPhoto} alt={t.authorName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400 text-xs">
              {t.authorName?.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-300">
          <div className="font-medium text-gray-200">{t.authorName || "User"}</div>
          <div className="text-gray-500">{ago}</div>
        </div>
      </div>

      <h3 className="mt-3 text-lg md:text-xl font-semibold text-gray-100">{t.title}</h3>

      <p className="mt-2 text-gray-300 line-clamp-2 whitespace-pre-wrap">
        {t.body}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          {tagList.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="text-sm text-gray-400">
          {t.replyCount || 0} {t.replyCount === 1 ? "reply" : "replies"}
        </div>
      </div>
    </Link>
  );
}

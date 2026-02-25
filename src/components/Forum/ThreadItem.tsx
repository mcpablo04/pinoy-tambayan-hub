"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import CategoryPill from "./CategoryPill";
import { MessageSquare, Clock, User } from "lucide-react";

export type Thread = {
  id: string;
  title: string;
  body: string;
  category?: string;
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
      className="group block relative rounded-2xl bg-[#121722] border border-gray-800/60 p-5 hover:bg-[#161b2a] hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        
        {/* Left: Author Avatar (Hidden on small mobile to save space) */}
        <div className="hidden sm:block relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 group-hover:border-blue-500/50 transition-colors flex-shrink-0 shadow-inner">
          {t.authorPhoto ? (
            <Image src={t.authorPhoto} alt={t.authorName || "User"} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center bg-gradient-to-br from-gray-700 to-gray-800 text-blue-400 font-bold">
              {(t.authorName || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 min-w-0">
          {/* Top Meta: Author & Time */}
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.15em]">
            <span className="text-blue-400 flex items-center gap-1">
              <User size={12} className="opacity-70" /> {t.authorName || "Anonymous"}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500 flex items-center gap-1">
              <Clock size={12} className="opacity-70" /> {ago}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors leading-tight mb-2 line-clamp-2">
            {t.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4 font-medium italic opacity-80">
            {t.body}
          </p>

          {/* Bottom Row: Category, Tags, and Replies */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/40">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryPill cat={t.category} />
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-gray-800/50 text-gray-500 border border-gray-700/50 group-hover:border-gray-600 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Reply Count Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <MessageSquare size={14} />
              <span className="text-xs font-black">{t.replyCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
"use client";

import { ReactNode } from "react";

export default function WidgetCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-[#121722] border border-gray-800/60 shadow-lg overflow-hidden transition-all duration-300 hover:border-gray-700/80 ${className}`}>
      {/* Header with a subtle gradient and bottom border */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-gray-800/20 to-transparent">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
          {/* Subtle accent dot */}
          <span className="w-1 h-1 rounded-full bg-blue-500" />
          {title}
        </h2>
      </div>

      {/* Content Area */}
      <div className="p-4 text-sm leading-relaxed text-gray-300">
        {children}
      </div>
      
      {/* Optional decorative bottom edge for that "premium" look */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
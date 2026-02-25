"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import WidgetCard from "./WidgetCard";

export default function ForumLayout({
  title,
  rightRail,
  children,
}: {
  title?: string;
  rightRail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 min-h-screen">
      {/* Optional Page Title Section */}
      {title && (
        <div className="mb-6 flex items-end justify-between border-b border-gray-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            {title}
          </h1>
        </div>
      )}

      {/* LAYOUT GRID:
          [260px Sidebar] [Flexible Center] [320px Sidebar]
          Note: We ensure parent has no 'overflow-hidden' to allow sticky children.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,320px] gap-6 items-start">
        
        {/* LEFT RAIL: Navigation */}
        <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
          <Sidebar />
        </aside>

        {/* CENTER FEED: Main Content */}
        {/* We use 'relative' here so children can use 'sticky top-0' inside it */}
        <section className="relative min-w-0 space-y-6 pb-20">
          {children}
        </section>

        {/* RIGHT RAIL: Widgets & Extra Info */}
        <aside className="hidden lg:flex flex-col gap-6 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
          {rightRail ?? (
            <WidgetCard title="Community Rules">
              <ul className="space-y-3">
                {[
                  "Help others find topics with tags.",
                  "Be respectful to all members.",
                  "Keep personal information private.",
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-400 leading-snug">
                    <span className="text-blue-500 font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </WidgetCard>
          )}
          
          {/* Subtle Branding/Footer in Rail */}
          <div className="px-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">
            Pinoy Tambayan &copy; 2026
          </div>
        </aside>
      </div>
    </main>
  );
}
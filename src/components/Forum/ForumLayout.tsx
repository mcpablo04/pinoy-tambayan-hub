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
    <main className="max-w-7xl mx-auto px-3 md:px-4 py-5">
      {title ? (
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-lg md:text-xl font-semibold text-gray-100">{title}</h1>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[260px,minmax(0,1fr),320px] gap-4">
        {/* LEFT */}
        <div className="md:sticky md:top-24 h-fit">
          <Sidebar />
        </div>

        {/* CENTER */}
        <div className="space-y-4">{children}</div>

        {/* RIGHT */}
        <div className="space-y-4 md:sticky md:top-24 h-fit">
          {rightRail ?? (
            <WidgetCard title="Tips">
              <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                <li>Use tags to help others find your topic.</li>
                <li>Be respectful and avoid sharing personal data.</li>
              </ul>
            </WidgetCard>
          )}
        </div>
      </div>
    </main>
  );
}

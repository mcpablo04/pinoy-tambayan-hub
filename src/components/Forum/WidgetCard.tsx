"use client";

import { ReactNode } from "react";

export default function WidgetCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#121722] border border-gray-800">
      <div className="px-3 py-2 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

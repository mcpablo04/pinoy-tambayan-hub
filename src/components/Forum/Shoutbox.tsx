"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, 
  limit, 
  orderBy, 
  query, 
  onSnapshot 
} from "firebase/firestore";

type Shout = {
  id: string;
  name?: string;
  text: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

function tsToDate(ts?: { seconds: number; nanoseconds: number }) {
  return ts ? new Date(ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6)) : undefined;
}

export default function Shoutbox() {
  const [items, setItems] = useState<Shout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We use onSnapshot instead of getDocs so messages pop up instantly
    const q = query(
      collection(db, "messages"), 
      orderBy("createdAt", "desc"), 
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ 
        id: d.id, 
        ...(d.data() as any) 
      })) as Shout[];
      setItems(rows);
      setLoading(false);
    }, (error) => {
      console.error("Shoutbox listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="rounded-2xl bg-[#121722] border border-gray-800 shadow-xl overflow-hidden mb-6">
      {/* Header with Live Indicator */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
            Live Shoutbox
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          Recent Activity
        </span>
      </div>

      {/* Message List */}
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto no-scrollbar scroll-smooth flex flex-col-reverse">
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-4 w-3/4 bg-gray-800 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-800 animate-pulse rounded" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-4 italic">
            The shoutbox is quiet... say something!
          </div>
        ) : (
          items.map((m) => {
            const when = tsToDate(m.createdAt);
            const time = when ? when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            
            return (
              <div key={m.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                    {m.name || "Guest"}
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">
                    {time}
                  </span>
                </div>
                <div className="text-sm text-gray-300 bg-gray-800/30 p-2.5 rounded-xl rounded-tl-none border border-gray-700/30 group-hover:border-gray-700 transition-all leading-relaxed whitespace-pre-wrap break-words">
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Disclaimer */}
      <div className="px-4 py-3 bg-blue-500/5 border-t border-gray-800/50">
        <p className="text-[10px] text-gray-500 font-medium leading-normal italic text-center">
          For technical help or questions, please <span className="text-blue-500 font-bold">post a thread</span> in the forums.
        </p>
      </div>
    </div>
  );
}
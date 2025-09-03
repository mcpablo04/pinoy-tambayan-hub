"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/clientApp";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

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
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(20))
        );
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Shout[];
        setItems(rows);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="rounded-2xl bg-[#121722] border border-gray-800">
      <div className="px-3 py-2 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
        Shoutbox
      </div>
      <div className="p-3 space-y-2 max-h-72 overflow-auto">
        {loading ? (
          <div className="text-gray-400 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-sm">No shouts yet. Be the first!</div>
        ) : (
          items.map((m) => {
            const when = tsToDate(m.createdAt);
            const time = when ? when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={m.id} className="text-sm text-gray-200">
                <span className="text-blue-300 font-medium">{m.name || "Guest"}</span>
                <span className="text-gray-500"> · {time}</span>
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
              </div>
            );
          })
        )}
      </div>
      <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
        For questions, please post a thread instead of using the shoutbox.
      </div>
    </div>
  );
}

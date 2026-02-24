"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";

type Confession = {
  id: string;
  text: string;
  fire: number;
  cry: number;
  laugh: number;
  skull: number;
};

export default function RelatableFeed() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "confessions"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Confession[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          text: data.text || "",
          fire: data.fire || 0,
          cry: data.cry || 0,
          laugh: data.laugh || 0,
          skull: data.skull || 0,
        });
      });
      setConfessions(list);
    });

    return () => unsub();
  }, []);

  const submitConfession = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "confessions"), {
      text: text.trim(),
      fire: 0,
      cry: 0,
      laugh: 0,
      skull: 0,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  const react = async (id: string, type: string) => {
    const ref = doc(db, "confessions", id);
    await updateDoc(ref, {
      [type]: increment(1),
    });
  };

  return (
    <div>
      {/* Submit */}
      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your story anonymously..."
          className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          maxLength={500}
        />
        <button
          onClick={submitConfession}
          className="mt-3 w-full bg-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-500 transition"
        >
          Submit Anonymously
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {confessions.map((c) => (
          <div
            key={c.id}
            className="p-5 bg-gray-800/70 rounded-xl border border-gray-700"
          >
            <p className="text-gray-200 whitespace-pre-wrap mb-4">
              {c.text}
            </p>

            <div className="flex gap-4 text-sm">
              <button onClick={() => react(c.id, "fire")}>
                🔥 {c.fire}
              </button>
              <button onClick={() => react(c.id, "cry")}>
                😭 {c.cry}
              </button>
              <button onClick={() => react(c.id, "laugh")}>
                😂 {c.laugh}
              </button>
              <button onClick={() => react(c.id, "skull")}>
                💀 {c.skull}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
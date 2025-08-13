"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/clientApp";
import { reload } from "firebase/auth";

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [photo, setPhoto] = useState(profile?.photoURL ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  // 1) Kick to /login if not signed in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // 2) If signed in, ensure email is verified; else send to /auth/verify-prompt
  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!auth.currentUser) return;
      try {
        await reload(auth.currentUser); // pick up latest emailVerified flag
        if (!auth.currentUser.emailVerified) {
          router.replace("/auth/verify-prompt");
        }
      } catch {
        // ignore; if reload fails we just continue to render
      }
    })();
  }, [loading, router]);

  // Keep local inputs in sync when profile changes
  useEffect(() => {
    setName(profile?.displayName ?? "");
    setPhoto(profile?.photoURL ?? "");
  }, [profile?.displayName, profile?.photoURL]);

  const save = async () => {
    setMsg(null);
    if (name.trim() && name.trim() !== (profile?.displayName ?? "")) {
      await updateDisplayName(name.trim());
    }
    if ((photo ?? "") !== (profile?.photoURL ?? "")) {
      await updatePhotoURL(photo.trim());
    }
    setMsg("Profile updated!");
    setTimeout(() => setMsg(null), 1800);
  };

  if (loading || !user) {
    return <div className="pt-20">Loading…</div>;
  }

  return (
    <div className="pt-20 max-w-2xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="flex items-center gap-4 mb-6">
        {photo ? (
          <img src={photo} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-800 grid place-items-center">👤</div>
        )}
        <div>
          <div className="text-lg font-semibold">{profile?.displayName || "No name yet"}</div>
          <div className="text-sm text-gray-400">{profile?.email}</div>
        </div>
      </div>

      <div className="space-y-3">
        <input
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Photo URL (https://...)"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
        />

        <button
          onClick={save}
          className="bg-blue-600 hover:bg-blue-500 rounded p-3 font-semibold"
        >
          Save changes
        </button>
        {msg && <div className="text-green-400 text-sm">{msg}</div>}
      </div>

      <div className="h-px bg-gray-800 my-6" />

      <button onClick={signOutApp} className="text-red-400 underline">
        Sign out
      </button>
    </div>
  );
}

// src/pages/profile.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/clientApp";
import { reload } from "firebase/auth";
import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";

import {
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const toHandleBase = (name: string) => {
  // only a–z 0–9 . _ - ; 3–20 chars target
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")      // remove disallowed
    .replace(/^[._-]+|[._-]+$/g, "")    // trim punctuation edges
    .slice(0, 20);                      // cap length
  return base || "user";
};

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const router = useRouter();

  // Basic profile fields
  const [name, setName]   = useState(profile?.displayName ?? "");
  const [photo, setPhoto] = useState(profile?.photoURL ?? "");
  const [msg, setMsg]     = useState<string | null>(null);

  // Avatar uploader UI state
  const [uploadMsg,  setUploadMsg]  = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Require email verification
  useEffect(() => {
    (async () => {
      if (loading || !auth.currentUser) return;
      try {
        await reload(auth.currentUser);
        if (!auth.currentUser.emailVerified) router.replace("/auth/verify-prompt");
      } catch {}
    })();
  }, [loading, router]);

  // Sync local from profile
  useEffect(() => {
    setName(profile?.displayName ?? "");
    setPhoto(profile?.photoURL ?? "");
  }, [profile?.displayName, profile?.photoURL]);

  const currentLower = useMemo(
    () =>
      // @ts-ignore (usernameLower may not exist yet)
      (profile?.usernameLower as string | undefined)?.toLowerCase() ??
      // @ts-ignore (older profiles might have "username")
      (profile?.username as string | undefined)?.toLowerCase() ??
      "",
    [profile]
  );

  // ---------- AVATAR UPLOAD ----------
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const f = inputEl.files?.[0];
    if (!f || !user) return;

    if (!f.type.startsWith("image/")) {
      setUploadMsg("Please choose an image file (jpg/png/webp).");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setUploadMsg("Please upload an image under 4 MB.");
      return;
    }

    try {
      setUploadBusy(true);
      setUploadMsg("Uploading…");

      const blob: PutBlobResult = await upload(
        `avatars/${user.uid}/${Date.now()}_${f.name}`,
        f,
        { access: "public", handleUploadUrl: "/api/avatar/upload" }
      );

      await updatePhotoURL(blob.url);
      setPhoto(blob.url);

      // (Optional) keep user doc in sync for convenience
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: blob.url,
        updatedAt: serverTimestamp(),
      });

      setUploadMsg("Uploaded!");
      setTimeout(() => setUploadMsg(null), 1500);
    } catch (err: any) {
      console.error(err);
      setUploadMsg(err?.message ?? "Upload failed.");
    } finally {
      setUploadBusy(false);
      inputEl.value = "";
    }
  };

  // ---------- CLAIM UNIQUE USERNAME FROM DISPLAY NAME ----------
  async function claimUsernameFromDisplayName(displayName: string) {
    if (!user) return null;

    const baseRaw = toHandleBase(displayName || "user");
    // ensure at least 3 chars (pad with uid if needed)
    let base = baseRaw.length >= 3 ? baseRaw : `${baseRaw}${user.uid.slice(0, 3 - baseRaw.length)}`;

    let chosen: string | null = null;

    await runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await tx.get(userRef);
      const current =
        (userSnap.exists() ? ((userSnap.data() as any).usernameLower as string | null) : null) ?? null;

      // Try base, base1, base2, … until free
      let i = 0;
      while (true) {
        const suffix = i === 0 ? "" : String(i);
        // keep within 20 chars total
        const trimmedBase = base.slice(0, Math.max(3, 20 - suffix.length));
        const candidate = `${trimmedBase}${suffix}`;

        // If already ours, keep it
        if (current && candidate === current) {
          chosen = current;
          break;
        }

        const unameRef = doc(db, "usernames", candidate);
        const unameSnap = await tx.get(unameRef);

        // available OR already mapped to us
        if (!unameSnap.exists() || (unameSnap.data() as any).uid === user.uid) {
          // free previous mapping if changing
          if (current && current !== candidate) {
            tx.delete(doc(db, "usernames", current));
          }
          // claim new mapping + update user doc
          tx.set(unameRef, { uid: user.uid, createdAt: serverTimestamp() });
          tx.set(
            userRef,
            { username: candidate, usernameLower: candidate, updatedAt: serverTimestamp() },
            { merge: true }
          );
          chosen = candidate;
          break;
        }

        i++;
        if (i > 9999) throw new Error("Could not find a free username.");
      }
    });

    return chosen;
  }

  // ---------- SAVE PROFILE (with unique display name) ----------
  const save = async () => {
    if (!user) return;
    setMsg(null);

    const newName  = name.trim();
    const newPhoto = (photo ?? "").trim();

    // 1) Enforce UNIQUE DISPLAY NAME (case-insensitive)
    if (newName && newName !== (profile?.displayName ?? "")) {
      const qName = query(
        collection(db, "users"),
        where("displayNameLower", "==", newName.toLowerCase())
      );
      const snap = await getDocs(qName);
      if (!snap.empty) {
        setMsg("That display name is already taken.");
        return;
      }
    }

    // 2) Update display name in auth (and optionally in your user doc)
    if (newName && newName !== (profile?.displayName ?? "")) {
      await updateDisplayName(newName);
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName,
        displayNameLower: newName.toLowerCase(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3) Update photo if changed (keep user doc in sync)
    if (newPhoto !== (profile?.photoURL ?? "")) {
      await updatePhotoURL(newPhoto);
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: newPhoto,
        updatedAt: serverTimestamp(),
      });
    }

    // 4) Ensure UNIQUE USERNAME derived from display name
    const chosen = await claimUsernameFromDisplayName(newName || "user");
    if (chosen) {
      setMsg(chosen !== currentLower ? `Saved. Your handle is @${chosen}.` : "Profile updated!");
    } else {
      setMsg("Profile updated!");
    }

    setTimeout(() => setMsg(null), 2000);
  };

  if (loading || !user) return <div className="pt-20">Loading…</div>;

  return (
    <div className="pt-20 max-w-2xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {/* Avatar + basic info */}
      <div className="flex items-center gap-4 mb-6">
        {photo ? (
          <img
            src={photo}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-800 grid place-items-center">
            <span className="text-3xl">👤</span>
          </div>
        )}
        <div>
          <div className="text-lg font-semibold">{profile?.displayName || "No name yet"}</div>
          <div className="text-sm text-gray-400">{profile?.email}</div>
        </div>
      </div>

      {/* Avatar uploader */}
      <div className="mb-6 space-y-2">
        <label className="block text-sm text-gray-300">Profile photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={onPickFile}
          disabled={uploadBusy}
          className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-500 disabled:opacity-60"
        />
        {uploadMsg && <div className="text-sm text-gray-300">{uploadMsg}</div>}
      </div>

      {/* Profile fields */}
      <div className="space-y-3">
        <input
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Display name (must be unique)"
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

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

/** Make TS happy even if profile has extra optional fields */
type AnyProfile = {
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  createdAt?: { seconds: number; nanoseconds?: number } | null;
  usernameLower?: string | null;
  username?: string | null;
} | null;

const toHandleBase = (name: string) =>
  (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 20) || "user";

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const router = useRouter();

  // cast to relaxed shape so TS doesn't complain about optional fields
  const p = (profile ?? null) as AnyProfile;

  // UI state
  const [name, setName] = useState<string>(p?.displayName ?? "");
  const [photo, setPhoto] = useState<string>(p?.photoURL ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  // redirect if not signed in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // require email verification
  useEffect(() => {
    (async () => {
      if (loading || !auth.currentUser) return;
      try {
        await reload(auth.currentUser);
        if (!auth.currentUser.emailVerified) router.replace("/auth/verify-prompt");
      } catch {
        /* ignore */
      }
    })();
  }, [loading, router]);

  // sync local with profile
  useEffect(() => {
    setName(p?.displayName ?? "");
    setPhoto(p?.photoURL ?? "");
  }, [p?.displayName, p?.photoURL]);

  // derive current handle if present (TS-safe)
  const currentLower = useMemo(() => {
    const lower =
      (p?.usernameLower ?? p?.username ?? "")?.toString().toLowerCase();
    return lower || "";
  }, [p?.usernameLower, p?.username]);

  // joined date (Firestore -> Auth fallback)
  const joinedDate = useMemo(() => {
    const ts = p?.createdAt?.seconds
      ? new Date(p.createdAt.seconds * 1000)
      : auth.currentUser?.metadata?.creationTime
      ? new Date(auth.currentUser.metadata.creationTime)
      : null;

    return ts
      ? ts.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      : null;
  }, [p?.createdAt?.seconds]);

  // upload avatar
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

  // claim a unique handle from display name
  async function claimUsernameFromDisplayName(displayName: string) {
    if (!user) return null;

    const baseRaw = toHandleBase(displayName || "user");
    const base = baseRaw.length >= 3 ? baseRaw : `${baseRaw}${user.uid.slice(0, 3 - baseRaw.length)}`;

    let chosen: string | null = null;

    await runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await tx.get(userRef);
      const current =
        (userSnap.exists() ? ((userSnap.data() as any).usernameLower as string | null) : null) ?? null;

      let i = 0;
      while (true) {
        const suffix = i === 0 ? "" : String(i);
        const trimmedBase = base.slice(0, Math.max(3, 20 - suffix.length));
        const candidate = `${trimmedBase}${suffix}`;

        if (current && candidate === current) {
          chosen = current;
          break;
        }

        const unameRef = doc(db, "usernames", candidate);
        const unameSnap = await tx.get(unameRef);

        if (!unameSnap.exists()) {
          tx.set(unameRef, { uid: user.uid, createdAt: serverTimestamp() });
          if (current && current !== candidate) {
            tx.delete(doc(db, "usernames", current));
          }
          tx.set(
            userRef,
            { username: candidate, usernameLower: candidate, updatedAt: serverTimestamp() },
            { merge: true }
          );
          chosen = candidate;
          break;
        }

        if ((unameSnap.data() as any).uid === user.uid) {
          if (current && current !== candidate) {
            tx.delete(doc(db, "usernames", current));
            tx.set(
              userRef,
              { username: candidate, usernameLower: candidate, updatedAt: serverTimestamp() },
              { merge: true }
            );
          }
          chosen = candidate;
          break;
        }

        i++;
        if (i > 9999) throw new Error("Could not find a free username.");
      }
    });

    return chosen;
  }

  // save
  const save = async () => {
    if (!user) return;
    setMsg(null);

    const newName  = name.trim();
    const newPhoto = (photo ?? "").trim();

    // ensure unique display name
    if (newName && newName !== (p?.displayName ?? "")) {
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

    // update display name
    if (newName && newName !== (p?.displayName ?? "")) {
      await updateDisplayName(newName);
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName,
        displayNameLower: newName.toLowerCase(),
        updatedAt: serverTimestamp(),
      });
    }

    // update photo if changed
    if (newPhoto !== (p?.photoURL ?? "")) {
      await updatePhotoURL(newPhoto);
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: newPhoto,
        updatedAt: serverTimestamp(),
      });
    }

    // ensure unique username derived from display name
    const chosen = await claimUsernameFromDisplayName(newName || "user");
    setMsg(chosen && chosen !== currentLower ? `Saved. Your handle is @${chosen}.` : "Profile updated!");
    setTimeout(() => setMsg(null), 2000);
  };

  if (loading || !user) return <div className="pt-20">Loading…</div>;

  return (
    <div className="pt-20 max-w-2xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {/* Avatar + basic info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="avatar">
          {photo ? (
            <img src={photo} alt="avatar" />
          ) : (
            /* fallback when no photo */
            <img src="data:image/svg+xml;utf8,\
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>\
              <rect width='100' height='100' fill='%231f2937'/>\
              <circle cx='50' cy='38' r='18' fill='%234b5563'/>\
              <rect x='22' y='62' width='56' height='24' rx='12' fill='%234b5563'/>\
              </svg>" alt="avatar placeholder" />
          )}
        </div>

        <div>
          <div className="text-lg font-semibold">{p?.displayName || "No name yet"}</div>
          <div className="text-sm text-gray-400">{p?.email}</div>
          {/* Joined date */}
          {joinedDate && <div className="text-xs text-gray-500">Joined {joinedDate}</div>}
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

        <button onClick={save} className="bg-blue-600 hover:bg-blue-500 rounded p-3 font-semibold">
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

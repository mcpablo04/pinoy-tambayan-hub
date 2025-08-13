// src/pages/profile.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/clientApp";
import { reload } from "firebase/auth";

// Vercel Blob
import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";

// Firestore
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

type HandleStatus = "idle" | "checking" | "available" | "taken" | "saving" | "error";

const sanitize = (s: string) => s.toLowerCase().trim();
const valid = (s: string) => /^[a-z0-9._-]{3,20}$/.test(s);

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const router = useRouter();

  // basic profile
  const [name, setName]   = useState(profile?.displayName ?? "");
  const [photo, setPhoto] = useState(profile?.photoURL ?? "");
  const [msg, setMsg]     = useState<string | null>(null);

  // avatar uploader
  const [uploadMsg,  setUploadMsg]  = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  // username
  const [handle, setHandle]               = useState<string>("");
  const [handleStatus, setHandleStatus]   = useState<HandleStatus>("idle");
  const [handleMsg, setHandleMsg]         = useState<string | null>(null);
  const [lastChecked, setLastChecked]     = useState<string | null>(null); // sanitized, last verified
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
      } catch {}
    })();
  }, [loading, router]);

  // sync local state from profile
  useEffect(() => {
    setName(profile?.displayName ?? "");
    setPhoto(profile?.photoURL ?? "");
    // @ts-ignore (extra fields from Firestore user doc)
    const current = (profile as any)?.username ?? "";
    setHandle(current ?? "");
    setLastChecked(null);
    setHandleStatus("idle");
    setHandleMsg(null);
  }, [profile?.displayName, profile?.photoURL]);

  // current usernameLower from profile (if present)
  const currentLower = useMemo(
    () =>
      sanitize(
        // @ts-ignore
        ((profile as any)?.usernameLower ?? (profile as any)?.username ?? "") as string
      ),
    [profile]
  );

  // ---------- AVATAR UPLOAD (Vercel Blob) ----------
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

  // ---------- USERNAME (debounced check + transaction save) ----------
  const doCheckHandle = async (raw: string) => {
    setHandleMsg(null);
    const h = sanitize(raw);

    if (!valid(h)) {
      setHandleStatus("error");
      setHandleMsg("Use 3–20 chars: a–z, 0–9, dot, underscore, or hyphen.");
      setLastChecked(null);
      return;
    }

    // unchanged from current ⇒ considered "available" (no-op)
    if (currentLower && h === currentLower) {
      setHandleStatus("available");
      setHandleMsg("This is already your username.");
      setLastChecked(h);
      return;
    }

    setHandleStatus("checking");
    try {
      const snap = await getDoc(doc(db, "usernames", h));
      if (snap.exists() && snap.data()?.uid !== user?.uid) {
        setHandleStatus("taken");
        setHandleMsg("That username is already taken.");
        setLastChecked(h);
      } else {
        setHandleStatus("available");
        setHandleMsg("Username is available.");
        setLastChecked(h);
      }
    } catch (e: any) {
      console.error(e);
      setHandleStatus("error");
      setHandleMsg(e?.message ?? "Failed to check username.");
      setLastChecked(null);
    }
  };

  // Debounced auto-check while typing
  useEffect(() => {
    if (!handle) {
      setHandleStatus("idle");
      setHandleMsg(null);
      setLastChecked(null);
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doCheckHandle(handle), 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  const manualCheck = async () => {
    if (handle) await doCheckHandle(handle);
  };

  const saveHandle = async () => {
    if (!user) return;

    const h = sanitize(handle);
    if (!valid(h)) {
      setHandleStatus("error");
      setHandleMsg("Invalid username.");
      return;
    }

    const unchanged = currentLower && h === currentLower;
    const okToSave = unchanged || (lastChecked === h && handleStatus === "available");
    if (!okToSave) {
      setHandleMsg("Please click Check first to confirm availability.");
      return;
    }

    setHandleStatus("saving");
    setHandleMsg(null);

    try {
      await runTransaction(db, async (tx) => {
        const unameRef = doc(db, "usernames", h);
        const userRef  = doc(db, "users", user.uid);

        const unameSnap = await tx.get(unameRef);
        const userSnap  = await tx.get(userRef);
        const current   = (userSnap.exists() ? (userSnap.data() as any).usernameLower : null) as
          | string
          | null;

        if (current === h) return; // no change

        if (unameSnap.exists() && (unameSnap.data() as any).uid !== user.uid) {
          throw new Error("That username is already taken.");
        }

        if (current) {
          tx.delete(doc(db, "usernames", current));
        }

        tx.set(unameRef, { uid: user.uid, createdAt: serverTimestamp() });
        tx.set(
          userRef,
          { username: handle, usernameLower: h, updatedAt: serverTimestamp() },
          { merge: true }
        );
      });

      setHandleStatus("idle");
      setHandleMsg("Username saved!");
      setLastChecked(h);
      // reflect locally
      // @ts-ignore
      (profile as any).username = handle;
      // @ts-ignore
      (profile as any).usernameLower = h;
      setTimeout(() => setHandleMsg(null), 1500);
    } catch (e: any) {
      console.error(e);
      setHandleStatus("error");
      setHandleMsg(e?.message ?? "Failed to save username.");
    }
  };

  // save display name / photo URL
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

  if (loading || !user) return <div className="pt-20">Loading…</div>;

  // Derived UI helpers for buttons
  const typedLower     = sanitize(handle);
  const unchanged      = !!currentLower && typedLower === currentLower;
  const canSaveNewName = lastChecked === typedLower && handleStatus === "available";
  const saveDisabled   =
    handleStatus === "saving" ||
    !valid(typedLower) ||
    (!unchanged && !canSaveNewName);

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

      {/* Display name & photo URL */}
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

      {/* Username */}
      <div className="h-px bg-gray-800 my-6" />
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Username</label>
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 rounded bg-gray-800 text-white placeholder-gray-400"
            placeholder="e.g. juan_dela_cruz"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          {!unchanged && (
            <button
              onClick={manualCheck}
              className="shrink-0 bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 font-semibold"
            >
              Check
            </button>
          )}
          <button
            onClick={saveHandle}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={saveDisabled}
          >
            {handleStatus === "saving" ? "Saving…" : "Save"}
          </button>
        </div>

        {unchanged ? (
          <div className="text-sm text-green-400">This is already your username.</div>
        ) : handleMsg ? (
          <div
            className={`text-sm ${
              handleStatus === "available"
                ? "text-green-400"
                : handleStatus === "taken" || handleStatus === "error"
                ? "text-red-400"
                : "text-gray-300"
            }`}
          >
            {handleMsg}
          </div>
        ) : null}
      </div>

      <div className="h-px bg-gray-800 my-6" />

      <button onClick={signOutApp} className="text-red-400 underline">
        Sign out
      </button>
    </div>
  );
}

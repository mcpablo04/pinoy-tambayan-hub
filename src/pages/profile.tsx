// src/pages/profile.tsx
"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
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
  collectionGroup,
  getCountFromServer,
  limit as fsLimit,
  orderBy,
  deleteDoc,
  writeBatch,
  type Timestamp,
  type Query,
  type CollectionReference,
} from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import Skeleton from "../components/Skeleton";

/* --------------------------- tiny toast system --------------------------- */
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; text: string };

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 w-[min(90vw,340px)]">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
    const hide = setTimeout(() => setShow(false), 2300);
    const done = setTimeout(onClose, 2600);
    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [onClose]);

  const tone =
    item.kind === "success"
      ? "bg-emerald-600/90 border-emerald-400/40"
      : item.kind === "error"
      ? "bg-red-600/90 border-red-400/40"
      : "bg-gray-800/90 border-white/10";

  const icon = item.kind === "success" ? "✅" : item.kind === "error" ? "⚠️" : "ℹ️";

  return (
    <div
      className={`pointer-events-auto rounded-lg border text-white shadow-xl backdrop-blur-sm px-3 py-2 text-sm transition-all duration-300
        ${tone} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden>{icon}</span>
        <div className="flex-1">{item.text}</div>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}

/* --------------------------- confirm modal --------------------------- */
type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  resolve?: (ok: boolean) => void;
};

function ConfirmDialog({ state, setState }: { state: ConfirmState; setState: (s: ConfirmState) => void }) {
  const close = (ok: boolean) => {
    state.resolve?.(ok);
    setState({ ...state, open: false });
  };
  return (
    <div className={`fixed inset-0 z-[90] ${state.open ? "" : "pointer-events-none"}`} aria-hidden={!state.open}>
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${state.open ? "opacity-100" : "opacity-0"}`}
        onClick={() => close(false)}
      />
      {/* dialog */}
      <div
        className={`absolute inset-0 flex items-end sm:items-center justify-center p-4 transition-all duration-200
          ${state.open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b0f19] p-5 shadow-2xl">
          <h3 className="text-lg font-semibold text-white">{state.title}</h3>
          <p className="mt-2 text-sm text-gray-300">{state.message}</p>
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <button
              onClick={() => close(false)}
              className="px-4 py-2 rounded-md border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => close(true)}
              className={`px-4 py-2 rounded-md text-white ${
                state.danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {state.confirmText ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function askConfirm(
  setState: (s: ConfirmState) => void,
  opts: Omit<ConfirmState, "open" | "resolve">
) {
  return new Promise<boolean>((resolve) => {
    setState({ ...opts, open: true, resolve });
  });
}

/* ---------------------------- page types ---------------------------- */
type AnyProfile =
  | {
      displayName?: string | null;
      photoURL?: string | null;
      email?: string | null;
      createdAt?: { seconds: number; nanoseconds?: number } | null;
      usernameLower?: string | null;
      username?: string | null;
    }
  | null;

type MyStory = {
  id: string;
  title: string;
  slug?: string | null;
  status?: "draft" | "published";
  visibility?: "public" | "unlisted" | "private";
  createdAt?: Timestamp;
};

type MyComment = {
  id: string;
  body: string;
  storyId: string;
  createdAt?: Timestamp;
};

const INITIAL_LIMIT = 3;
const ALL_LIMIT = 100;

const toHandleBase = (name: string) =>
  (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 20) || "user";

const toStoryLink = (id: string, slug?: string | null) =>
  `/stories/${slug && slug.length > 0 ? slug : id}`;

/** Best-effort subcollection cleanup */
async function deleteSubcollection(col: CollectionReference | Query, batchSize = 400) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await getDocs(query(col, fsLimit(batchSize)));
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < batchSize) break;
  }
}

/* =============================== PAGE =============================== */
export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const router = useRouter();

  const p = (profile ?? null) as AnyProfile;

  // Editable fields
  const [name, setName] = useState<string>(p?.displayName ?? "");
  const [photo, setPhoto] = useState<string>(p?.photoURL ?? "");

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, text: string) =>
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), kind, text }]);
  const popToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Confirm
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
  });

  // Upload state
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  // Stats
  const [storyCount, setStoryCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);

  // Lists + loading
  const [stories, setStories] = useState<MyStory[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Limits
  const [storiesLimit, setStoriesLimit] = useState(INITIAL_LIMIT);
  const [commentsLimit, setCommentsLimit] = useState(INITIAL_LIMIT);

  const [countNote, setCountNote] = useState<string | null>(null);

  // Redirect if not signed-in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Email verify prompt (optional)
  useEffect(() => {
    (async () => {
      if (loading || !auth.currentUser) return;
      try {
        await reload(auth.currentUser);
        if (!auth.currentUser.emailVerified) router.replace("/auth/verify-prompt");
      } catch {}
    })();
  }, [loading, router]);

  // Sync local form with profile
  useEffect(() => {
    setName(p?.displayName ?? "");
    setPhoto(p?.photoURL ?? "");
  }, [p?.displayName, p?.photoURL]);

  const currentLower = useMemo(() => {
    const lower = (p?.usernameLower ?? p?.username ?? "")?.toString().toLowerCase();
    return lower || "";
  }, [p?.usernameLower, p?.username]);

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

  /* --------------------------- Avatar Upload --------------------------- */
  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
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
      pushToast("success", "Profile photo updated.");
    } catch (err: any) {
      console.error(err);
      setUploadMsg(err?.message ?? "Upload failed.");
      pushToast("error", "Upload failed. Please try again.");
    } finally {
      setUploadBusy(false);
      inputEl.value = "";
    }
  };

  /* --------------------------- Username claim -------------------------- */
  async function claimUsernameFromDisplayName(displayName: string) {
    if (!user) return null;

    const baseRaw = toHandleBase(displayName || "user");
    const base = baseRaw.length >= 3 ? baseRaw : `${baseRaw}${user.uid.slice(0, 3 - baseRaw.length)}`;

    let chosen: string | null = null;

    await runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await tx.get(userRef);
      const current =
        (userSnap.exists()
          ? ((userSnap.data() as any).usernameLower as string | null)
          : null) ?? null;

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

  /* ------------------------------ Save -------------------------------- */
  const save = async () => {
    if (!user) return;

    const newName = name.trim();
    const newPhoto = (photo ?? "").trim();

    if (newName.length < 3 || newName.length > 40) {
      pushToast("error", "Display name must be between 3 and 40 characters.");
      return;
    }

    // Ensure unique display name (ignore self)
    if (newName && newName !== (p?.displayName ?? "")) {
      const qName = query(collection(db, "users"), where("displayNameLower", "==", newName.toLowerCase()));
      const snap = await getDocs(qName);
      const takenByOther = snap.docs.some((d) => d.id !== user.uid);
      if (takenByOther) {
        pushToast("error", "That display name is already taken.");
        return;
      }
    }

    if (newName && newName !== (p?.displayName ?? "")) {
      await updateDisplayName(newName);
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName,
        displayNameLower: newName.toLowerCase(),
        updatedAt: serverTimestamp(),
      });
    }

    if (newPhoto !== (p?.photoURL ?? "")) {
      await updatePhotoURL(newPhoto);
      await updateDoc(doc(db, "users", user.uid), { photoURL: newPhoto, updatedAt: serverTimestamp() });
    }

    const chosen = await claimUsernameFromDisplayName(newName || "user");
    pushToast("success", chosen ? `Saved. Your handle is @${chosen}.` : "Profile updated!");
  };

  /* ------------------------------ Loaders ------------------------------ */
  const loadMyStories = useCallback(
    async (uid: string, lim: number) => {
      setStoriesLoading(true);
      try {
        const storiesQ = query(
          collection(db, "stories"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc"),
          fsLimit(lim)
        );
        const sSnap = await getDocs(storiesQ);
        const sList: MyStory[] = [];
        sSnap.forEach((d) => {
          const s = d.data() as any;
          sList.push({
            id: d.id,
            title: s.title,
            slug: s.slug ?? null,
            status: s.status,
            visibility: s.visibility,
            createdAt: s.createdAt,
          });
        });
        setStories(sList);
      } catch (e) {
        console.warn("Stories list error:", (e as FirebaseError)?.message);
        setStories([]);
      } finally {
        setStoriesLoading(false);
      }
    },
    []
  );

  async function fallbackLoadMyComments(uid: string, lim: number): Promise<MyComment[]> {
    const recentStoriesSnap = await getDocs(
      query(collection(db, "stories"), orderBy("createdAt", "desc"), fsLimit(40))
    );

    const storyIds = recentStoriesSnap.docs.map((d) => d.id);
    const collected: MyComment[] = [];

    for (const sid of storyIds) {
      const csnap = await getDocs(
        query(
          collection(db, "stories", sid, "comments"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc"),
          fsLimit(3)
        )
      );
      csnap.forEach((d) => {
        const data = d.data() as any;
        collected.push({
          id: d.id,
          body: data.body ?? "",
          storyId: sid,
          createdAt: data.createdAt,
        });
      });
      if (collected.length >= lim) break;
    }

    collected.sort((a, b) => {
      const ta = a.createdAt ? (a.createdAt as Timestamp).toMillis?.() ?? 0 : 0;
      const tb = b.createdAt ? (b.createdAt as Timestamp).toMillis?.() ?? 0 : 0;
      return tb - ta;
    });

    return collected.slice(0, lim);
  }

  const loadMyComments = useCallback(
    async (uid: string, lim: number) => {
      setCommentsLoading(true);
      setCountNote(null);
      try {
        const commentsQ = query(
          collectionGroup(db, "comments"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc"),
          fsLimit(lim)
        );
        const cSnap = await getDocs(commentsQ);
        const cList: MyComment[] = [];
        cSnap.forEach((d) => {
          const data = d.data() as any;
          const storyId = d.ref.parent.parent?.id || "";
          cList.push({
            id: d.id,
            body: data.body ?? "",
            storyId,
            createdAt: data.createdAt,
          });
        });
        setComments(cList);
      } catch (e) {
        console.warn("Comments list error:", (e as FirebaseError)?.message);
        const fallback = await fallbackLoadMyComments(uid, lim);
        setComments(fallback);
        setCountNote((n) => n ?? "Using a temporary fallback. Create the collection-group index for best results.");
      } finally {
        setCommentsLoading(false);
      }
    },
    []
  );

  // Counts on mount
  useEffect(() => {
    (async () => {
      if (!user?.uid) {
        setStatsLoading(false);
        return;
      }

      try {
        const storiesQ = query(collection(db, "stories"), where("authorId", "==", user.uid));
        const sCountSnap = await getCountFromServer(storiesQ);
        setStoryCount(sCountSnap.data().count);
      } catch (e) {
        console.warn("Story count error:", (e as FirebaseError)?.message);
        setStoryCount(null);
      }

      try {
        const commentsQ = query(
          collectionGroup(db, "comments"),
          where("authorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const cCountSnap = await getCountFromServer(commentsQ);
        setCommentCount(cCountSnap.data().count);
      } catch (e) {
        const err = e as FirebaseError;
        console.warn("Comment count error:", err?.code, err?.message);
        setCommentCount(null);
        setCountNote(
          "Comment count needs a Firestore collection-group index for `comments` with fields: authorId ASC, createdAt DESC."
        );
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [user?.uid]);

  // Lists react to limits
  useEffect(() => {
    if (!user?.uid) return;
    loadMyStories(user.uid, storiesLimit);
  }, [user?.uid, storiesLimit, loadMyStories]);

  useEffect(() => {
    if (!user?.uid) return;
    loadMyComments(user.uid, commentsLimit);
  }, [user?.uid, commentsLimit, loadMyComments]);

  const showStoriesViewAll =
    !storiesLoading && storiesLimit === INITIAL_LIMIT && ((storyCount ?? stories.length) > stories.length);
  const showCommentsViewAll =
    !commentsLoading && commentsLimit === INITIAL_LIMIT && ((commentCount ?? comments.length) > comments.length);

  /* ------------------------------ Deletions ----------------------------- */
  const deleteStory = useCallback(
    async (sid: string) => {
      if (!user?.uid) return;

      const ok = await askConfirm(setConfirm, {
        title: "Delete story?",
        message:
          "The story will be removed immediately. Comments and reactions will be cleaned up where allowed. This cannot be undone.",
        confirmText: "Delete story",
        danger: true,
      });
      if (!ok) return;

      try {
        // delete the story first (author is allowed)
        await deleteDoc(doc(db, "stories", sid));

        // best-effort cleanup (ignore errors if rules block)
        try {
          await deleteSubcollection(collection(db, "stories", sid, "comments"));
        } catch {}
        try {
          await deleteSubcollection(collection(db, "stories", sid, "reactions"));
        } catch {}

        // refresh list to keep it full
        await loadMyStories(user.uid, storiesLimit);

        if (storyCount != null) setStoryCount((c) => (c ?? 1) - 1);
        pushToast("success", "Story deleted.");
      } catch (e) {
        console.error("Delete story error:", e);
        pushToast("error", "Failed to delete story. Please try again.");
      }
    },
    [user?.uid, storiesLimit, loadMyStories, storyCount]
  );

  const deleteComment = useCallback(
    async (sid: string, cid: string) => {
      if (!user?.uid) return;

      const ok = await askConfirm(setConfirm, {
        title: "Delete comment?",
        message: "This comment will be removed. This cannot be undone.",
        confirmText: "Delete comment",
        danger: true,
      });
      if (!ok) return;

      try {
        await deleteDoc(doc(db, "stories", sid, "comments", cid));

        // refresh so recent/view-all stays packed
        await loadMyComments(user.uid, commentsLimit);

        if (commentCount != null) setCommentCount((c) => (c ?? 1) - 1);
        pushToast("success", "Comment deleted.");
      } catch (e) {
        console.error("Delete comment error:", e);
        pushToast("error", "Failed to delete comment. Please try again.");
      }
    },
    [user?.uid, commentsLimit, loadMyComments, commentCount]
  );

  if (loading || !user) {
    return (
      <div className="section">
        <div className="container-page">Loading…</div>
      </div>
    );
  }

  return (
    <section className="section">
      <div className="container-page max-w-5xl">
        {/* Confirm + Toasts */}
        <ConfirmDialog state={confirm} setState={setConfirm} />
        <ToastViewport toasts={toasts} onClose={popToast} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="avatar h-14 w-14 rounded-full overflow-hidden bg-gray-700 shrink-0">
              {photo ? (
                <img src={photo} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <img
                  src={`data:image/svg+xml;utf8,\
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>\
                <rect width='100' height='100' fill='%231f2937'/>\
                <circle cx='50' cy='38' r='18' fill='%234b5563'/>\
                <rect x='22' y='62' width='56' height='24' rx='12' fill='%234b5563'/>\
                </svg>`}
                  alt="avatar placeholder"
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="page-title mb-0">{p?.displayName || "My Profile"}</h1>
              <div className="text-sm text-gray-400 truncate">{p?.email || user.email}</div>
              <div className="text-xs text-gray-500">
                {joinedDate ? `Joined ${joinedDate}` : ""}
                {currentLower ? (
                  <>
                    {" "}
                    • <span className="text-gray-300">@{currentLower}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="sm:ml-auto w-full sm:w-auto">
            <Link href="/stories/new" className="btn btn-primary w-full sm:w-auto">
              Write a Story
            </Link>
          </div>
        </div>

        {/* Profile editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="card">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Profile Photo</h2>
            <label className="text-sm text-gray-400 block mb-2">Upload a new avatar (max 4 MB)</label>
            <input
              type="file"
              accept="image/*"
              onChange={onPickFile}
              disabled={uploadBusy}
              className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-500 disabled:opacity-60"
            />
            {uploadMsg && <div className="text-sm text-gray-300 mt-2">{uploadMsg}</div>}
          </section>

          <section className="card">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Display Name</h2>
            <input
              className="input"
              placeholder="Display name (3–40 chars, must be unique)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
              <button onClick={save} className="btn btn-primary w-full sm:w-auto">
                Save changes
              </button>
            </div>
          </section>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          <div className="card h-24">
            <div className="text-gray-400 text-xs">Posts</div>
            <div className="mt-1 text-2xl text-white font-semibold">
              {statsLoading ? <Skeleton className="h-6 w-14" /> : storyCount ?? "—"}
            </div>
          </div>
          <div className="card h-24">
            <div className="text-gray-400 text-xs">Comments</div>
            <div className="mt-1 text-2xl text-white font-semibold">
              {statsLoading ? <Skeleton className="h-6 w-14" /> : commentCount ?? "—"}
            </div>
          </div>
          <div className="card h-24">
            <div className="text-gray-400 text-xs">Reads (session)</div>
            <div className="mt-1 text-2xl text-white font-semibold">—</div>
          </div>
          <div className="card h-24">
            <div className="text-gray-400 text-xs">Reactions</div>
            <div className="mt-1 text-2xl text-white font-semibold">—</div>
          </div>
        </div>
        {countNote && <div className="mb-6 text-xs text-amber-300">{countNote}</div>}

        {/* Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Stories */}
          <section>
            <h2 className="text-lg font-semibold mb-3">My Stories</h2>

            {storiesLoading ? (
              <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </ul>
            ) : stories.length === 0 ? (
              <p className="text-gray-400">
                You haven’t written anything yet.{" "}
                <Link href="/stories/new" className="text-blue-400 underline">
                  Start here
                </Link>
                .
              </p>
            ) : (
              <>
                <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                  {stories.map((s) => (
                    <li key={s.id} className="card p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">
                            <Link href={toStoryLink(s.id, s.slug)} className="hover:underline">
                              {s.title}
                            </Link>
                          </h3>
                          <div className="text-xs text-gray-400 mt-1">
                            {s.status || "published"} · {s.visibility || "public"}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteStory(s.id)}
                          className="shrink-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5"
                          title="Delete story"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {showStoriesViewAll && (
                  <div className="mt-3">
                    <button
                      onClick={() => setStoriesLimit(ALL_LIMIT)}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View all my stories ({storyCount})
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* My Recent Comments */}
          <section>
            <h2 className="text-lg font-semibold mb-3">My Recent Comments</h2>

            {commentsLoading ? (
              <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </ul>
            ) : comments.length === 0 ? (
              <p className="text-gray-400">No comments yet.</p>
            ) : (
              <>
                <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                  {comments.map((c) => (
                    <li key={c.id} className="card p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-gray-100 whitespace-pre-wrap break-words">
                            {c.body.length > 160 ? c.body.slice(0, 160) + "…" : c.body}
                          </p>
                          <div className="text-xs text-gray-400 mt-1">
                            on{" "}
                            <Link href={toStoryLink(c.storyId, null)} className="text-blue-400 hover:underline">
                              this story
                            </Link>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteComment(c.storyId, c.id)}
                          className="shrink-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5"
                          title="Delete comment"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {showCommentsViewAll && (
                  <div className="mt-3">
                    <button
                      onClick={() => setCommentsLimit(ALL_LIMIT)}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View all my comments ({commentCount})
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="h-px bg-gray-800 my-8" />

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={signOutApp}
            className="w-full sm:w-auto text-center text-red-300 hover:text-red-200 underline px-4 py-2 rounded-md hover:bg-white/5 transition"
          >
            Sign out
          </button>
        </div>

        <div className="page-bottom-spacer" />
      </div>
    </section>
  );
}

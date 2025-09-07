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
  onSnapshot,
  type Timestamp,
  type Query as FsQuery,
  type CollectionReference,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import Skeleton from "../components/Skeleton";
import MetaHead from "../components/MetaHead";

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

/* products */
type MyProduct = {
  id: string;
  title: string;
  imageUrl: string;
  affiliateUrl: string;
  pricePhp?: number | null;
  category?: string | null;
  store?: string | null;
  createdAt?: Timestamp;
};

/* forum thread + reply types */
type MyThread = {
  id: string;
  title: string;
  category?: string | null;
  replyCount?: number | null;
  createdAt?: Timestamp;
};

type MyThreadReply = {
  id: string;
  body: string;
  threadId: string;
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
async function deleteSubcollection(
  col: CollectionReference<DocumentData> | FsQuery<DocumentData>,
  batchSize = 400
) {
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
  const [commentCount, setCommentCount] = useState<number | null>(null); // story-only
  const [repliesCount, setRepliesCount] = useState<number | null>(null); // forum replies total (realtime)
  const [repliesCountLoading, setRepliesCountLoading] = useState(true);

  // Lists + loading (stories/comments)
  const [stories, setStories] = useState<MyStory[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Limits
  const [storiesLimit, setStoriesLimit] = useState(INITIAL_LIMIT);
  const [commentsLimit, setCommentsLimit] = useState(INITIAL_LIMIT);

  const [countNote, setCountNote] = useState<string | null>(null);

  /* products */
  const [products, setProducts] = useState<MyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsLimit, setProductsLimit] = useState(INITIAL_LIMIT);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [productsNote, setProductsNote] = useState<string | null>(null);

  /* forum states */
  const [threads, setThreads] = useState<MyThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsLimit, setThreadsLimit] = useState(INITIAL_LIMIT);
  const [threadCount, setThreadCount] = useState<number | null>(null);
  const [threadsNote, setThreadsNote] = useState<string | null>(null);

  const [replies, setReplies] = useState<MyThreadReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [repliesLimit, setRepliesLimit] = useState(INITIAL_LIMIT);
  const [repliesNote, setRepliesNote] = useState<string | null>(null);

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

  /* ------------------------------ Loaders (stories/comments/products) ------------------------------ */
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

  const loadMyComments = useCallback(
    async (uid: string, lim: number) => {
      setCommentsLoading(true);
      setCountNote(null);
      try {
        // ✅ story comments ONLY, properly indexed
        const commentsQ = query(
          collectionGroup(db, "comments"),
          where("authorId", "==", uid),
          where("parentKind", "==", "story"),
          orderBy("createdAt", "desc"),
          fsLimit(lim)
        );
        const cSnap = await getDocs(commentsQ);
        const cList: MyComment[] = [];
        cSnap.forEach((d) => {
          const parentDoc = d.ref.parent.parent; // stories/{storyId}
          if (!parentDoc) return;
          const data = d.data() as any;
          cList.push({
            id: d.id,
            body: data.body ?? "",
            storyId: parentDoc.id,
            createdAt: data.createdAt,
          });
        });
        setComments(cList);
      } catch (e) {
        const err = e as FirebaseError;
        console.warn("Comments list error:", err?.code, err?.message);
        setComments([]);
        setCountNote(
          "Create a collection-group index on comments(authorId ASC, parentKind ASC, createdAt DESC)."
        );
      } finally {
        setCommentsLoading(false);
      }
    },
    []
  );

  /* products */
  const loadMyProducts = useCallback(
    async (uid: string, lim: number) => {
      setProductsLoading(true);
      setProductsNote(null);
      try {
        const productsQ = query(
          collection(db, "products"),
          where("ownerUid", "==", uid),
          orderBy("createdAt", "desc"),
          fsLimit(lim)
        );
        const pSnap = await getDocs(productsQ);
        const list: MyProduct[] = [];
        pSnap.forEach((d) => {
          const P = d.data() as any;
          list.push({
            id: d.id,
            title: P.title,
            imageUrl: P.imageUrl,
            affiliateUrl: P.affiliateUrl,
            pricePhp: P.pricePhp ?? null,
            category: P.category ?? null,
            store: P.store ?? null,
            createdAt: P.createdAt,
          });
        });
        setProducts(list);
      } catch (e) {
        const err = e as FirebaseError;
        console.warn("Products list error:", err?.code, err?.message);
        setProducts([]);
        setProductsNote(
          "Products list may require an index: collection=products, where ownerUid==, order by createdAt desc."
        );
      } finally {
        setProductsLoading(false);
      }
    },
    []
  );

  /* ------------------------------ REALTIME: my forum threads ------------------------------ */
  useEffect(() => {
    if (!user?.uid) return;
    setThreadsLoading(true);
    setThreadsNote(null);

    const qy = query(
      collection(db, "threads"),
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc"),
      fsLimit(threadsLimit)
    );

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: MyThread[] = [];
        snap.forEach((d) => {
          const T = d.data() as any;
          list.push({
            id: d.id,
            title: T.title,
            category: T.category ?? null,
            replyCount: T.replyCount ?? 0,
            createdAt: T.createdAt,
          });
        });
        setThreads(list);
        setThreadCount(snap.size);
        setThreadsLoading(false);
      },
      (err: FirestoreError) => {
        console.warn("Threads realtime error:", err.code, err.message);
        setThreads([]);
        setThreadsLoading(false);
        setThreadsNote(
          "Threads list may require an index: collection=threads, where authorId==, order by createdAt desc."
        );
      }
    );

    return () => unsub();
  }, [user?.uid, threadsLimit]);

  /* ------------------------------ REALTIME: my forum replies (list) ------------------------------ */
  useEffect(() => {
    if (!user?.uid) return;
    setRepliesLoading(true);
    setRepliesNote(null);

    // ✅ Filter parentKind == 'thread' so the CG index is used and no post-filtering is needed
    const qy = query(
      collectionGroup(db, "comments"),
      where("authorId", "==", user.uid),
      where("parentKind", "==", "thread"),
      orderBy("createdAt", "desc"),
      fsLimit(repliesLimit)
    );

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: MyThreadReply[] = [];
        snap.forEach((d) => {
          const parentDoc = d.ref.parent.parent; // threads/{threadId}
          if (!parentDoc) return;

          const C = d.data() as any;
          list.push({
            id: d.id,
            body: C.body ?? "",
            threadId: parentDoc.id,
            createdAt: C.createdAt,
          });
        });

        setReplies(list);
        setRepliesLoading(false);
      },
      (err: FirestoreError) => {
        console.warn("Replies realtime error (list):", err.code, err.message);
        setReplies([]);
        setRepliesLoading(false);
        setRepliesNote(
          "If replies look incomplete, ensure comments carry parentKind:'thread' and that the CG index exists."
        );
      }
    );

    return () => unsub();
  }, [user?.uid, repliesLimit]);

  /* ------------------------------ REALTIME: my forum replies (TOTAL COUNT) ------------------------------ */
  useEffect(() => {
    if (!user?.uid) return;
    setRepliesCountLoading(true);

    // ✅ Same filter; simple, real-time count from snapshot size
    const qAll = query(
      collectionGroup(db, "comments"),
      where("authorId", "==", user.uid),
      where("parentKind", "==", "thread"),
      orderBy("createdAt", "desc")
    );

    const unsubAll = onSnapshot(
      qAll,
      (snap) => {
        setRepliesCount(snap.size);
        setRepliesCountLoading(false);
      },
      (err: FirestoreError) => {
        console.warn("Replies realtime error (count):", err.code, err.message);
        setRepliesCount(null);
        setRepliesCountLoading(false);
      }
    );

    return () => unsubAll();
  }, [user?.uid]);

  // Counts on mount (stories/story-comments/products)
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
        // ✅ story comments ONLY (no orderBy needed for count)
        const storyCommentsCountQ = query(
          collectionGroup(db, "comments"),
          where("authorId", "==", user.uid),
          where("parentKind", "==", "story")
        );
        const cCountSnap = await getCountFromServer(storyCommentsCountQ);
        setCommentCount(cCountSnap.data().count);
      } catch (e) {
        const err = e as FirebaseError;
        console.warn("Comment count error:", err?.code, err?.message);
        setCommentCount(null);
        setCountNote(
          "Story comment count needs a CG index on comments(authorId ASC, parentKind ASC)."
        );
      } finally {
        setStatsLoading(false);
      }

      // products count
      try {
        const productsQ = query(collection(db, "products"), where("ownerUid", "==", user.uid));
        const pCountSnap = await getCountFromServer(productsQ);
        setProductCount(pCountSnap.data().count);
      } catch (e) {
        console.warn("Product count error:", (e as FirebaseError)?.message);
        setProductCount(null);
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

  useEffect(() => {
    if (!user?.uid) return;
    loadMyProducts(user.uid, productsLimit);
  }, [user?.uid, productsLimit, loadMyProducts]);

  const showStoriesViewAll =
    !storiesLoading && storiesLimit === INITIAL_LIMIT && ((storyCount ?? stories.length) > stories.length);
  const showCommentsViewAll =
    !commentsLoading && commentsLimit === INITIAL_LIMIT && ((commentCount ?? comments.length) > comments.length);
  const showProductsViewAll =
    !productsLoading && productsLimit === INITIAL_LIMIT && ((productCount ?? products.length) > products.length);

  const showThreadsViewAll =
    !threadsLoading && threadsLimit === INITIAL_LIMIT && ((threadCount ?? threads.length) > threads.length);

  const showRepliesViewAll =
    !repliesLoading &&
    repliesLimit === INITIAL_LIMIT &&
    (repliesCount ?? 0) > replies.length;

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
        await deleteDoc(doc(db, "stories", sid));

        // best-effort cleanup
        try {
          await deleteSubcollection(collection(db, "stories", sid, "comments"));
        } catch {}
        try {
          await deleteSubcollection(collection(db, "stories", sid, "reactions"));
        } catch {}

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
        await loadMyComments(user.uid, commentsLimit);
        if (commentCount != null) setCommentCount((c) => Math.max(0, (c ?? 1) - 1));
        pushToast("success", "Comment deleted.");
      } catch (e) {
        console.error("Delete comment error:", e);
        pushToast("error", "Failed to delete comment. Please try again.");
      }
    },
    [user?.uid, commentsLimit, loadMyComments, commentCount]
  );

  /* products */
  const deleteProduct = useCallback(
    async (pid: string) => {
      if (!user?.uid) return;

      const ok = await askConfirm(setConfirm, {
        title: "Delete product?",
        message: "This product will be removed from the marketplace. This cannot be undone.",
        confirmText: "Delete product",
        danger: true,
      });
      if (!ok) return;

      try {
        await deleteDoc(doc(db, "products", pid));
        await loadMyProducts(user.uid, productsLimit);
        if (productCount != null) setProductCount((c) => Math.max(0, (c ?? 1) - 1));
        pushToast("success", "Product deleted.");
      } catch (e) {
        console.error("Delete product error:", e);
        pushToast("error", "Failed to delete product. Please try again.");
      }
    },
    [user?.uid, productsLimit, loadMyProducts, productCount]
  );

  const peso = (n?: number | null) =>
    typeof n === "number" ? n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }) : "—";

  if (loading || !user) {
    return (
      <div className="section">
        <div className="container-page">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <MetaHead
        title="My Profile • Pinoy Tambayan Hub"
        description="Manage your display name, avatar, and see your stories, forum posts & replies, comments, and products."
        noindex
      />

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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
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
              <div className="text-gray-400 text-xs">Comments (stories)</div>
              <div className="mt-1 text-2xl text-white font-semibold">
                {statsLoading ? <Skeleton className="h-6 w-14" /> : commentCount ?? "—"}
              </div>
            </div>
            <div className="card h-24">
              <div className="text-gray-400 text-xs">Forum Threads</div>
              <div className="mt-1 text-2xl text-white font-semibold">
                {threadsLoading ? <Skeleton className="h-6 w-14" /> : threadCount ?? threads.length ?? "—"}
              </div>
            </div>
            <div className="card h-24">
              <div className="text-gray-400 text-xs">Forum Replies</div>
              <div className="mt-1 text-2xl text-white font-semibold">
                {repliesCountLoading ? <Skeleton className="h-6 w-14" /> : repliesCount ?? "—"}
              </div>
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

                  {!storiesLoading && storiesLimit === INITIAL_LIMIT && ((storyCount ?? stories.length) > stories.length) && (
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

            {/* My Recent Story Comments */}
            <section>
              <h2 className="text-lg font-semibold mb-3">My Recent Story Comments</h2>

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

                  {!commentsLoading && commentsLimit === INITIAL_LIMIT && ((commentCount ?? comments.length) > comments.length) && (
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

          {/* My Forum Threads & Replies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* My Forum Threads */}
            <section>
              <h2 className="text-lg font-semibold mb-3">My Forum Threads</h2>

              {threadsLoading ? (
                <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </ul>
              ) : threads.length === 0 ? (
                <p className="text-gray-400">
                  You haven’t posted any forum threads yet.{" "}
                  <Link href="/forums/new" className="text-blue-400 underline">
                    Start here
                  </Link>
                  .
                </p>
              ) : (
                <>
                  <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                    {threads.map((t) => (
                      <li key={t.id} className="card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium">
                              <Link href={`/forums/${t.id}`} className="hover:underline">
                                {t.title}
                              </Link>
                            </h3>
                            <div className="text-xs text-gray-400 mt-1">
                              #{t.category || "general"} · {(t.replyCount ?? 0)}{" "}
                              {(t.replyCount ?? 0) === 1 ? "reply" : "replies"}
                            </div>
                          </div>
                          <Link
                            href={`/forums/${t.id}`}
                            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {!threadsLoading && threadsLimit === INITIAL_LIMIT && ((threadCount ?? threads.length) > threads.length) && (
                    <div className="mt-3">
                      <button
                        onClick={() => setThreadsLimit(ALL_LIMIT)}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        View all my threads ({threadCount})
                      </button>
                    </div>
                  )}
                </>
              )}

              {threadsNote && <div className="mt-2 text-xs text-amber-300">{threadsNote}</div>}
            </section>

            {/* My Forum Replies */}
            <section>
              <h2 className="text-lg font-semibold mb-3">My Forum Replies</h2>

              {repliesLoading ? (
                <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </ul>
              ) : replies.length === 0 ? (
                <p className="text-gray-400">No forum replies yet.</p>
              ) : (
                <>
                  <ul className="space-y-3 min-h-[180px] sm:min-h-[220px]">
                    {replies.map((r) => (
                      <li key={r.id} className="card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-gray-100 whitespace-pre-wrap break-words">
                              {r.body.length > 160 ? r.body.slice(0, 160) + "…" : r.body}
                            </p>
                            <div className="text-xs text-gray-400 mt-1">
                              on{" "}
                              <Link href={`/forums/${r.threadId}`} className="text-blue-400 hover:underline">
                                this thread
                              </Link>
                            </div>
                          </div>
                          <Link
                            href={`/forums/${r.threadId}`}
                            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {showRepliesViewAll && (
                    <div className="mt-3">
                      <button
                        onClick={() => setRepliesLimit(ALL_LIMIT)}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        View more replies{typeof repliesCount === "number" ? ` (${repliesCount})` : ""}
                      </button>
                    </div>
                  )}
                </>
              )}

              {repliesNote && <div className="mt-2 text-xs text-amber-300">{repliesNote}</div>}
            </section>
          </div>

          {/* Products */}
          <section className="mt-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold">My Products</h2>
              <Link href="/marketplace/new" className="text-sm text-blue-400 hover:underline">
                Post a Product →
              </Link>
            </div>

            {productsLoading ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </ul>
            ) : products.length === 0 ? (
              <p className="text-gray-400">
                You haven’t posted any products yet.{" "}
                <Link href="/marketplace/new" className="text-blue-400 underline">
                  Add one now
                </Link>
                .
              </p>
            ) : (
              <>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((p) => (
                    <li key={p.id} className="card p-3 relative">
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="absolute right-2 top-2 z-10 rounded-md bg-red-600/90 text-white text-xs px-2 py-1 hover:bg-red-500"
                        title="Delete product"
                      >
                        Delete
                      </button>

                      <a
                        href={p.affiliateUrl}
                        rel="nofollow sponsored noopener"
                        target="_blank"
                        className="flex gap-3"
                        aria-label={`${p.title} – open affiliate link`}
                      >
                        <div className="w-24 h-16 overflow-hidden rounded">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium line-clamp-2">{p.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {p.category || "Others"} {p.store ? `· via ${p.store}` : ""}
                          </div>
                          <div className="text-sm mt-1">{peso(p.pricePhp ?? null)}</div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>

                {!productsLoading && productsLimit === INITIAL_LIMIT && ((productCount ?? products.length) > products.length) && (
                  <div className="mt-3">
                    <button
                      onClick={() => setProductsLimit(ALL_LIMIT)}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View all my products ({productCount})
                    </button>
                  </div>
                )}
              </>
            )}

            {productsNote && <div className="mt-2 text-xs text-amber-300">{productsNote}</div>}
          </section>

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
    </>
  );
}

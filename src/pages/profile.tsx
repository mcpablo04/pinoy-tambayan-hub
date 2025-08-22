"use client";

import Link from "next/link";
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
  collectionGroup,
  getCountFromServer,
  limit,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import Skeleton from "../components/Skeleton";

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

const toHandleBase = (name: string) =>
  (name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 20) || "user";

const toStoryLink = (id: string, slug?: string | null) =>
  `/stories/${slug && slug.length > 0 ? slug : id}`;

export default function ProfilePage() {
  const { user, profile, loading, updateDisplayName, updatePhotoURL, signOutApp } = useAuth();
  const router = useRouter();

  const p = (profile ?? null) as AnyProfile;

  const [name, setName] = useState<string>(p?.displayName ?? "");
  const [photo, setPhoto] = useState<string>(p?.photoURL ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [storyCount, setStoryCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [stories, setStories] = useState<MyStory[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [countNote, setCountNote] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      if (loading || !auth.currentUser) return;
      try {
        await reload(auth.currentUser);
        if (!auth.currentUser.emailVerified) router.replace("/auth/verify-prompt");
      } catch {}
    })();
  }, [loading, router]);

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

  // Upload avatar
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

  // Username claim
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

  // Save profile
  const save = async () => {
    if (!user) return;
    setMsg(null);

    const newName = name.trim();
    const newPhoto = (photo ?? "").trim();

    if (newName.length < 3 || newName.length > 40) {
      setMsg("Display name must be between 3 and 40 characters.");
      return;
    }

    if (newName && newName !== (p?.displayName ?? "")) {
      const qName = query(collection(db, "users"), where("displayNameLower", "==", newName.toLowerCase()));
      const snap = await getDocs(qName);
      const takenByOther = snap.docs.some((d) => d.id !== user.uid);
      if (takenByOther) {
        setMsg("That display name is already taken.");
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
    setMsg(chosen && chosen !== currentLower ? `Saved. Your handle is @${chosen}.` : "Profile updated!");
    setTimeout(() => setMsg(null), 2000);
  };

  // Fallback loader if CG index isn’t ready
  async function fallbackLoadMyComments(uid: string): Promise<MyComment[]> {
    const recentStoriesSnap = await getDocs(
      query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(40))
    );

    const storyIds = recentStoriesSnap.docs.map((d) => d.id);
    const collected: MyComment[] = [];

    for (const sid of storyIds) {
      const csnap = await getDocs(
        query(
          collection(db, "stories", sid, "comments"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(3)
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
      if (collected.length >= 20) break;
    }

    collected.sort((a, b) => {
      const ta = a.createdAt ? (a.createdAt as Timestamp).toMillis?.() ?? 0 : 0;
      const tb = b.createdAt ? (b.createdAt as Timestamp).toMillis?.() ?? 0 : 0;
      return tb - ta;
    });

    return collected.slice(0, 20);
  }

  // Load activity (uses CG index: authorId ASC + createdAt DESC)
  useEffect(() => {
    (async () => {
      if (!user?.uid) {
        setStatsLoading(false);
        return;
      }

      setCountNote(null);

      const storiesQ = query(collection(db, "stories"), where("authorId", "==", user.uid));
      const commentsQ = query(
        collectionGroup(db, "comments"),
        where("authorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      try {
        const sCountSnap = await getCountFromServer(storiesQ);
        setStoryCount(sCountSnap.data().count);
      } catch (e) {
        console.warn("Story count error:", (e as FirebaseError)?.message);
        setStoryCount(null);
      }

      try {
        const cCountSnap = await getCountFromServer(commentsQ);
        setCommentCount(cCountSnap.data().count);
      } catch (e) {
        const err = e as FirebaseError;
        console.warn("Comment count error:", err?.code, err?.message);
        setCommentCount(null);
        setCountNote(
          "Comment count needs a Firestore collection-group index for `comments` with fields: authorId ASC, createdAt DESC."
        );
      }

      try {
        const sSnap = await getDocs(query(storiesQ, orderBy("createdAt", "desc"), limit(20)));
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
      }

      try {
        const cSnap = await getDocs(query(commentsQ, limit(20)));
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
        const fallback = await fallbackLoadMyComments(user.uid);
        setComments(fallback);
        setCountNote((n) => n ?? "Using a temporary fallback. Create the collection-group index for best results.");
      }

      setStatsLoading(false);
    })();
  }, [user?.uid]);

  if (loading || !user) return <div className="pt-20">Loading…</div>;

  return (
    <main className="pt-20 sm:pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="avatar h-14 w-14 rounded-full overflow-hidden bg-gray-700">
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
            <h1 className="text-2xl font-semibold text-white truncate">{p?.displayName || "My Profile"}</h1>
            <div className="text-sm text-gray-400 truncate">{p?.email || user.email}</div>
            <div className="text-xs text-gray-500">
              {joinedDate ? `Joined ${joinedDate}` : ""}
              {currentLower ? <> • <span className="text-gray-300">@{currentLower}</span></> : null}
            </div>
          </div>

          <div className="ml-auto">
            <Link href="/stories/new" className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90">
              Write a Story
            </Link>
          </div>
        </div>

        {/* Upload + name edit */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Profile Photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={onPickFile}
              disabled={uploadBusy}
              className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-500 disabled:opacity-60"
            />
            {uploadMsg && <div className="text-sm text-gray-300 mt-2">{uploadMsg}</div>}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Display Name</h2>
            <input
              className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
              placeholder="Display name (3–40 chars, must be unique)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
            <div className="mt-3 flex items-center gap-2">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-500 rounded px-4 py-2 font-semibold">
                Save changes
              </button>
              {msg && <div className="text-green-400 text-sm">{msg}</div>}
            </div>
          </section>
        </div>

        {/* Stats: fixed height + skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-24">
            <div className="text-gray-400 text-xs">Posts</div>
            <div className="mt-1 text-2xl text-white font-semibold">
              {statsLoading ? <Skeleton className="h-6 w-14" /> : (storyCount ?? "—")}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-24">
            <div className="text-gray-400 text-xs">Comments</div>
            <div className="mt-1 text-2xl text-white font-semibold">
              {statsLoading ? <Skeleton className="h-6 w-14" /> : (commentCount ?? "—")}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-24">
            <div className="text-gray-400 text-xs">Reads (session)</div>
            <div className="mt-1 text-2xl text-white font-semibold">—</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-24">
            <div className="text-gray-400 text-xs">Reactions</div>
            <div className="mt-1 text-2xl text-white font-semibold">—</div>
          </div>
        </div>
        {countNote && <div className="mb-6 text-xs text-amber-300">{countNote}</div>}

        {/* Lists: min height + skeleton rows */}
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">My Stories</h2>
            {statsLoading ? (
              <ul className="space-y-3 min-h-[220px]">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </ul>
            ) : stories.length === 0 ? (
              <p className="text-gray-400">
                You haven’t written anything yet.{" "}
                <Link href="/stories/new" className="text-blue-400 underline">Start here</Link>.
              </p>
            ) : (
              <ul className="space-y-3 min-h-[220px]">
                {stories.map((s) => (
                  <li key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <h3 className="font-medium text-white">
                      <Link href={toStoryLink(s.id, s.slug)} className="hover:underline">
                        {s.title}
                      </Link>
                    </h3>
                    <div className="text-xs text-gray-400 mt-1">
                      {s.status || "published"} · {s.visibility || "public"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">My Recent Comments</h2>
            {statsLoading ? (
              <ul className="space-y-3 min-h-[220px]">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </ul>
            ) : comments.length === 0 ? (
              <p className="text-gray-400">No comments yet.</p>
            ) : (
              <ul className="space-y-3 min-h-[220px]">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-gray-100 whitespace-pre-wrap break-words">
                      {c.body.length > 160 ? c.body.slice(0, 160) + "…" : c.body}
                    </p>
                    <div className="text-xs text-gray-400 mt-1">
                      on{" "}
                      <Link href={toStoryLink(c.storyId, null)} className="text-blue-400 hover:underline">
                        this story
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="h-px bg-gray-800 my-8" />

        <button onClick={signOutApp} className="text-red-400 underline">Sign out</button>
      </div>
    </main>
  );
}

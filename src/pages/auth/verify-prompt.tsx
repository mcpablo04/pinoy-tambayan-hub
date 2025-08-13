// src/pages/auth/verify-prompt.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../../firebase/clientApp";
import { onAuthStateChanged, sendEmailVerification, reload } from "firebase/auth";

export default function VerifyPrompt() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setSignedIn(false);
        setUserEmail(null);
        return;
      }
      setSignedIn(true);
      setUserEmail(u.email);
      await reload(u);
      if (u.emailVerified) router.replace("/profile");
    });
    return () => unsub();
  }, [router]);

  const resend = async () => {
    setMsg(null);

    if (!auth.currentUser) {
      setMsg("You're signed out. Go to Login and sign in with your email to resend the link.");
      return;
    }

    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/login?verified=1`,
        handleCodeInApp: false, // simple redirect back to /login after verifying
      });
      setMsg("Verification email sent. Please check your inbox (and spam).");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const imVerified = async () => {
    setMsg(null);

    // If signed out, just send them to login to continue
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }

    setChecking(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        router.replace("/profile");
      } else {
        setMsg("Not verified yet. After clicking the link, press this again.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="pt-20 max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Verify your email</h1>

      <p className="text-gray-300">
        We sent a verification link
        {userEmail ? (
          <> to <span className="font-semibold">{userEmail}</span>.</>
        ) : (
          <> to your email address.</>
        )}
      </p>

      {!signedIn && (
        <p className="text-sm text-gray-400 mt-2">
          You appear to be signed out (that’s expected right after sign-up).
          Click the link in your inbox to verify, then sign in.
        </p>
      )}

      {msg && <p className="mt-3 text-sm text-amber-300">{msg}</p>}

      <div className="mt-6 space-y-3">
        <button
          onClick={resend}
          disabled={sending || !signedIn}
          className={`w-full py-3 rounded font-semibold ${
            signedIn
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-800 cursor-not-allowed opacity-60"
          }`}
          title={signedIn ? "" : "Sign in to resend the verification email"}
        >
          {sending ? "Sending…" : "Resend email"}
        </button>

        <button
          onClick={imVerified}
          disabled={checking}
          className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-semibold"
        >
          {checking ? "Checking…" : signedIn ? "I’ve verified, continue" : "I’ve verified — Go to Login"}
        </button>
      </div>
    </section>
  );
}

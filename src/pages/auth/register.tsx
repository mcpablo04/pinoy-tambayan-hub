// src/pages/auth/register.tsx  (or wherever your sign-up form is)
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth } from "../../firebase/clientApp"; // make sure clientApp exports `auth`

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }

      // Send verify email with a redirect back to our action handler
      const actionUrl = `${window.location.origin}/auth/action`;
      await sendEmailVerification(cred.user, { url: actionUrl, handleCodeInApp: true });

      // Go to "check your inbox" page
      router.replace("/auth/verify-prompt");
    } catch (e: any) {
      setErr(e?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-20 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full bg-gray-800 rounded p-3" placeholder="Display name"
               value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
        <input className="w-full bg-gray-800 rounded p-3" placeholder="Email" type="email"
               value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full bg-gray-800 rounded p-3" placeholder="Password" type="password"
               value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button disabled={loading} className="w-full bg-blue-600 py-3 rounded font-semibold">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </section>
  );
}

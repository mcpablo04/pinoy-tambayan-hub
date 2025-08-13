// src/pages/login.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/clientApp";

const friendly = (code: string) => {
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
};

export default function LoginPage() {
  const {
    signInGoogle,
    // signInFacebook, // keep commented if you're skipping FB for now
    registerEmail,
    signInEmail,
    loading,
    user,
  } = useAuth();

  const router = useRouter();

  // If already signed in, bounce to profile
  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);

  // If coming back from a verified link (?verified=1), show a success message
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const q = router.query as { verified?: string };
    if (q?.verified === "1") {
      setMsg("Email verified! You can sign in now.");
    }
  }, [router.query]);

  const handleEmail = async () => {
    setErr(null);
    setMsg(null);
    try {
      if (mode === "login") {
        await signInEmail(email, pass);
        return;
      }

      // REGISTER mode: AuthContext already sends verification + signs out
      await registerEmail(email, pass, displayName.trim() || undefined);
      router.replace("/auth/verify-prompt");
    } catch (e: any) {
      // If it's a Firebase error, show friendly; otherwise show message text
      setErr(e?.code ? friendly(e.code) : e?.message ?? "Something went wrong.");
    }
  };

  const resetPassword = async () => {
    setErr(null);
    setMsg(null);
    if (!email) {
      setErr("Enter your email first to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent. Please check your inbox.");
    } catch (e: any) {
      setErr(e?.code ? friendly(e.code) : e?.message ?? "Something went wrong.");
    }
  };

  return (
    <div className="pt-20 max-w-md mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>

      <p className="text-gray-400 mb-6 text-sm">
        Continue with Google or use your email.
      </p>

      {/* Email form */}
      <div className="space-y-3">
        {mode === "register" && (
          <input
            className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
        <input
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        {err && <div className="text-red-400 text-sm">{err}</div>}
        {msg && <div className="text-green-400 text-sm">{msg}</div>}

        <button
          onClick={handleEmail}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 rounded p-3 font-semibold"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in with Email" : "Register with Email"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={resetPassword}
            className="text-sm text-blue-400 underline mt-1"
          >
            Forgot password?
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center my-5 gap-3 text-gray-500">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs">OR</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Social buttons */}
      <div className="space-y-2">
        <button
          onClick={signInGoogle}
          disabled={loading}
          className="w-full bg-white text-gray-900 rounded p-3 font-semibold"
        >
          Continue with Google
        </button>
        {/* Skip Facebook for now
        <button
          onClick={signInFacebook}
          disabled={loading}
          className="w-full bg-blue-700 text-white rounded p-3 font-semibold"
        >
          Continue with Facebook
        </button> */}
      </div>

      {/* Switch mode */}
      <p className="text-sm text-gray-400 mt-5">
        {mode === "login" ? (
          <>
            Don’t have an account?{" "}
            <button className="underline" onClick={() => setMode("register")}>
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button className="underline" onClick={() => setMode("login")}>
              Sign in
            </button>
          </>
        )}
      </p>

      {/* Small back link */}
      <p className="text-xs text-gray-500 mt-6">
        <Link href="/" className="underline">← Back to Home</Link>
      </p>
    </div>
  );
}

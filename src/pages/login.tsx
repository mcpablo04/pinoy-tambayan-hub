// src/pages/login.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
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
    registerEmail,
    signInEmail,
    loading,
    user,
  } = useAuth();

  const router = useRouter();

  // bounce if already signed in
  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);

  // state
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // show success after email verification redirect
  useEffect(() => {
    const q = router.query as { verified?: string };
    if (q?.verified === "1") setMsg("Email verified! You can sign in now.");
  }, [router.query]);

  const onSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      if (mode === "login") {
        await signInEmail(email, pass);
        return;
      }
      await registerEmail(email, pass, displayName.trim() || undefined);
      router.replace("/auth/verify-prompt");
    } catch (e: any) {
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
    <section className="section">
      <div className="container-page max-w-md">
        {/* Heading + tabs */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="page-title mb-0">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          {/* Quick home link for small screens */}
          <Link href="/" className="text-sm text-blue-400 hover:underline">
            ← Home
          </Link>
        </div>

        {/* Segmented control (very clickable) */}
        <div className="mb-5 inline-flex rounded-lg border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-4 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-200 hover:bg-white/10"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`px-4 py-2 text-sm font-medium transition border-l border-white/10 ${
              mode === "register"
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-200 hover:bg-white/10"
            }`}
          >
            Register
          </button>
        </div>

        {/* Little subtitle */}
        <p className="text-gray-400 mb-4 text-sm">
          Continue with Google or use your email.
        </p>

        {/* Alerts */}
        {err && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-3 py-2">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-3 py-2">
            {msg}
          </div>
        )}

        {/* Card */}
        <div className="card">
          {/* Email form */}
          <form onSubmit={onSubmitEmail} className="space-y-3">
            {mode === "register" && (
              <div>
                <label htmlFor="displayName" className="sr-only">Display name</label>
                <input
                  id="displayName"
                  className="input"
                  placeholder="Display name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                className="input"
                placeholder="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  className="input pr-12"
                  placeholder="Password"
                  type={showPass ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded text-xs text-gray-300 hover:text-white hover:bg-white/10"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                ? "Sign in with Email"
                : "Register with Email"}
            </button>

            {mode === "login" && (
              <button
                type="button"
                onClick={resetPassword}
                className="text-sm text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center my-5 gap-3 text-gray-500">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Socials */}
          <div className="space-y-2">
            <button
              onClick={signInGoogle}
              disabled={loading}
              className="w-full rounded-lg bg-white text-gray-900 px-4 py-3 font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              Continue with Google
            </button>
          </div>
        </div>

        {/* Bottom links (clickable) */}
        <div className="mt-4 text-sm text-gray-400">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                className="text-blue-400 hover:underline"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="text-blue-400 hover:underline"
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-blue-400 hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
        </p>

        <div className="page-bottom-spacer" />
      </div>
    </section>
  );
}

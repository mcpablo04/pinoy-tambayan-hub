"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase/clientApp";
import MetaHead from "../components/MetaHead";
import { Mail, Lock, User, Eye, EyeOff, Chrome, Facebook } from "lucide-react";

const friendly = (code: string) => {
  switch (code) {
    case "auth/invalid-email": return "That email address looks invalid.";
    case "auth/email-already-in-use": return "That email is already registered. Try signing in.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a bit.";
    default: return "Something went wrong. Please try again.";
  }
};

export default function LoginPage() {
  const { signInGoogle, signInFacebook, registerEmail, signInEmail, loading, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) router.replace("/profile");
  }, [user, loading, router]);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Check for verification success from URL
  useEffect(() => {
    if (router.query?.verified === "1") {
      setMsg("Email verified successfully! You can now sign in.");
    }
  }, [router.query]);

  const onSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      if (mode === "login") {
        await signInEmail(email, pass);
        router.push("/");
      } else {
        await registerEmail(email, pass, displayName.trim() || undefined);
        setMsg("Verification email sent! Please check your inbox before logging in.");
        setMode("login"); // Switch to login so they can sign in after verifying
      }
    } catch (e: any) {
      setErr(e?.code ? friendly(e.code) : e?.message ?? "An error occurred.");
    }
  };

  const resetPassword = async () => {
    setErr(null);
    if (!email) return setErr("Please enter your email address first.");
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset link sent to your email.");
    } catch (e: any) {
      setErr(friendly(e.code));
    }
  };

  return (
    <>
      <MetaHead 
        title={mode === "login" ? "Sign In | Pinoy Tambayan" : "Create Account | Pinoy Tambayan"} 
        description="Join the Pinoy Tambayan community to save your favorite radio stations."
        noindex 
      />

      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
              {mode === "login" ? "Welcome Back" : "Join the Hub"}
            </h1>
            <p className="mt-2 text-slate-400">
              {mode === "login" ? "Sign in to access your favorites" : "Create an account to get started"}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-white/5">
            <button 
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === "login" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === "register" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Register
            </button>
          </div>

          {/* Alerts */}
          {(err || msg) && (
            <div className={`p-4 rounded-2xl border animate-in fade-in zoom-in duration-300 ${err ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"}`}>
              <p className="text-sm font-medium text-center">{err || msg}</p>
            </div>
          )}

          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <form onSubmit={onSubmitEmail} className="space-y-4">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-4 top-4 text-slate-500" size={20} />
                  <input
                    type="text"
                    placeholder="Display Name"
                    className="w-full bg-slate-800/50 border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-slate-800/50 border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-slate-800/50 border border-white/5 p-4 pl-12 pr-12 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-white"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={resetPassword} className="text-xs text-blue-500 hover:underline">
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-4 text-slate-500">Or Continue With</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={signInGoogle}
                className="flex items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-white text-sm font-semibold"
              >
                <Chrome size={18} className="text-red-400" /> Google
              </button>
              <button 
                onClick={signInFacebook}
                className="flex items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-white text-sm font-semibold"
              >
                <Facebook size={18} className="text-blue-500" /> Facebook
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs px-4">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-blue-500 hover:underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>.
          </p>

          <div className="text-center">
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← Back to Radio Hub
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
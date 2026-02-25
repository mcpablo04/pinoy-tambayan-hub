"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../lib/firebase";
import MetaHead from "../components/MetaHead";
import { Mail, Lock, User, Eye, EyeOff, Chrome, Facebook, ArrowLeft, Loader2 } from "lucide-react";

const friendly = (code: string) => {
  switch (code) {
    case "auth/invalid-email": return "That email address looks invalid.";
    case "auth/email-already-in-use": return "That email is already registered. Try signing in.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a bit.";
    default: return "Something went wrong. Please try again.";
  }
};

export default function LoginPage() {
  const { signInGoogle, signInFacebook, registerEmail, signInEmail, loading, user } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) router.replace("/profile");
  }, [user, loading, router]);

  // Handle URL verification success
  useEffect(() => {
    if (router.query?.verified === "1") {
      setMsg("Email verified successfully! You can now sign in.");
    }
  }, [router.query]);

  // Clear messages when swapping modes
  const toggleMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErr(null);
    setMsg(null);
  };

  const onSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      if (mode === "login") {
        await signInEmail(email, pass);
        router.push("/profile");
      } else {
        await registerEmail(email, pass, displayName.trim() || undefined);
        setMsg("Check your inbox! We've sent a verification link to your email.");
        setMode("login");
        setPass("");
      }
    } catch (e: any) {
      setErr(e?.code ? friendly(e.code) : "An unexpected error occurred.");
    }
  };

  const handleSocialAuth = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    setErr(null);
    try {
      if (provider === "google") await signInGoogle();
      else await signInFacebook();
    } catch (e: any) {
      setErr(friendly(e.code));
    } finally {
      setSocialLoading(null);
    }
  };

  const resetPassword = async () => {
    setErr(null);
    if (!email) return setErr("Please enter your email address first.");
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset link sent! Check your email inbox.");
    } catch (e: any) {
      setErr(friendly(e.code));
    }
  };

  return (
    <>
      <MetaHead 
        title={mode === "login" ? "Sign In | Pinoy Tambayan" : "Join the Community | Pinoy Tambayan"} 
        description="Login to save your favorite OPM stations and join the community chat."
        noindex 
      />

      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] px-4 py-20 relative overflow-hidden">
        {/* Animated Background Element */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full space-y-8 relative z-10">
          
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter font-display">
              {mode === "login" ? "Balik Tambayan" : "Sali na sa Hub"}
            </h1>
            <p className="text-slate-500 font-medium">
              {mode === "login" ? "Your favorite OPM stations are waiting." : "Unlock favorites, chat, and community stories."}
            </p>
          </div>

          <div className="flex p-1.5 bg-white/[0.03] backdrop-blur-md rounded-[1.5rem] border border-white/10">
            <button 
              onClick={() => toggleMode("login")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "login" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-500 hover:text-white"}`}
            >
              Login
            </button>
            <button 
              onClick={() => toggleMode("register")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "register" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-500 hover:text-white"}`}
            >
              Register
            </button>
          </div>

          {(err || msg) && (
            <div className={`p-5 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${err ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"}`}>
              <p className="text-sm font-bold text-center w-full leading-relaxed">{err || msg}</p>
            </div>
          )}

          <div className="bg-[#0a0f1d]/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-3xl">
            <form onSubmit={onSubmitEmail} className="space-y-5">
              {mode === "register" && (
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Display Name"
                    className="w-full bg-white/[0.03] border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all font-medium"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/[0.03] border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-white/[0.03] border border-white/10 p-5 pl-14 pr-14 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all font-medium"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {mode === "login" && (
                <div className="flex justify-end pr-1">
                  <button type="button" onClick={resetPassword} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex justify-center items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]"><span className="bg-[#0a0f1d] px-4 text-slate-600">Quick Access</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleSocialAuth("google")}
                disabled={!!socialLoading}
                className="flex items-center justify-center gap-3 p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all text-white text-[11px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                {socialLoading === "google" ? <Loader2 className="animate-spin" size={18} /> : <><Chrome size={18} className="text-red-500" /> Google</>}
              </button>
              <button 
                onClick={() => handleSocialAuth("facebook")}
                disabled={!!socialLoading}
                className="flex items-center justify-center gap-3 p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all text-white text-[11px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                {socialLoading === "facebook" ? <Loader2 className="animate-spin" size={18} /> : <><Facebook size={18} className="text-blue-500" /> Facebook</>}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest max-w-[280px] leading-loose">
              By joining, you agree to our <Link href="/terms" className="text-blue-500">Terms</Link> & <Link href="/privacy" className="text-blue-500">Privacy</Link>.
            </p>
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Hub
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
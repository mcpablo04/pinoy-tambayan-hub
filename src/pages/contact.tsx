"use client";

import Head from "next/head";
import { FormEvent, useState } from "react";
import { Send, CheckCircle2, AlertCircle, Mail, User, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState(""); 
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    setSending(true);

    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, hp }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed to send");
      
      setOk(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (e: any) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us | Pinoy Tambayan Hub</title>
        <meta name="description" content="Get in touch with Pinoy Tambayan Hub. Send us your feedback or requests." />
      </Head>

      <div className="max-w-xl mx-auto py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 mb-4">
            <Mail size={32} />
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Get in Touch</h1>
          <p className="text-slate-500 mt-2 font-medium">May suggestyon ka ba? Tara, usap tayo.</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
          {ok ? (
            <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center mb-4 text-green-500">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic">Salamat!</h2>
              <p className="text-slate-400 mt-2">Nakuha na namin ang iyong mensahe. Balitaan ka namin agad!</p>
              <button 
                onClick={() => setOk(false)}
                className="mt-8 text-blue-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {err && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                  <AlertCircle size={18} /> {err}
                </div>
              )}

              {/* Honeypot */}
              <input value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" tabIndex={-1} />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 outline-none transition-all font-bold text-sm"
                    placeholder="Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 outline-none transition-all font-bold text-sm"
                    placeholder="juan@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Your Message</label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-6 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 outline-none transition-all font-bold text-sm min-h-[160px] resize-none"
                    placeholder="Ano ang masasabi mo?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    Send Message <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* TRUST BADGE */}
        <p className="text-center mt-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
          Typically responds within 24 hours
        </p>
      </div>
    </>
  );
}
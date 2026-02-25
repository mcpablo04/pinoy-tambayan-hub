"use client";

import Head from "next/head";
import { FormEvent, useState } from "react";
import { Send, CheckCircle2, AlertCircle, Mail, User, MessageSquare, ShieldCheck } from "lucide-react";

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
    if (hp) return; // Silent fail for bots
    
    setErr("");
    setOk(false);
    setSending(true);

    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to send");
      
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
        <title>Contact Us • Pinoy Tambayan Hub</title>
        <meta name="description" content="Get in touch with the Pinoy Tambayan Hub team. Send us your feedback, radio requests, or inquiries." />
      </Head>

      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* HEADER SECTION */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] text-blue-500 mb-6 shadow-inner">
            <Mail size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none font-display">
            Tara, <span className="text-blue-500">Usap Tayo.</span>
          </h1>
          <p className="text-slate-500 mt-4 font-medium max-w-sm mx-auto">
            Have a station request or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="relative group">
          {/* Decorative Blur Background */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-[#0a0f1d] border border-white/5 p-10 md:p-14 rounded-[3rem] shadow-2xl backdrop-blur-xl">
            {ok ? (
              <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 ring-4 ring-emerald-500/5">
                    <CheckCircle2 size={48} />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight font-display">Mensahe: Sent!</h2>
                <p className="text-slate-400 mt-3 font-medium">Salamat sa pag-abot. Check your email soon!</p>
                <button 
                  onClick={() => setOk(false)}
                  className="mt-10 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-white/5"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8">
                {err && (
                  <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest">
                    <AlertCircle size={18} /> {err}
                  </div>
                )}

                {/* Honeypot Hidden Field */}
                <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Pangalan</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm"
                        placeholder="Juan Dela Cruz"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm"
                        placeholder="juan@tambayan.ph"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Mensahe Para sa Hub</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-5 top-6 text-slate-600" size={18} />
                    <textarea
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-6 pl-14 pr-6 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm min-h-[180px] resize-none"
                      placeholder="Anong nasa isip mo kabayan?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="group w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-4"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Padala Mensahe <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-full">
            <ShieldCheck size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure & Confidential</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Typically Responds within 24 Hours
          </p>
        </div>
      </div>
    </>
  );
}
// /src/pages/contact.tsx
"use client";

import { FormEvent, useState } from "react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState(""); // honeypot (hidden)
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
      setErr(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section">
      <div className="container-page max-w-md">
        <h2 className="page-title">📬 Contact Us</h2>

        {ok && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-200 px-3 py-2">
            Thanks! Your message was sent.
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-3 py-2">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Honeypot field (hidden) */}
          <input
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <input
            className="input"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
          <input
            className="input"
            placeholder="Your Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            required
          />
          <textarea
            className="input min-h-[140px]"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            required
          />

          <button
            className="w-full btn btn-primary py-3 font-semibold disabled:opacity-60"
            disabled={sending}
            type="submit"
          >
            {sending ? "Sending…" : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}

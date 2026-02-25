// src/pages/auth/action.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { applyActionCode } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function AuthActionPage() {
  const router = useRouter();
  const { mode, oobCode } = router.query as { mode?: string; oobCode?: string };
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("Verifying…");

  useEffect(() => {
    if (!mode || !oobCode) return;
    if (mode !== "verifyEmail") {
      setStatus("error");
      setMessage("Unsupported action.");
      return;
    }
    (async () => {
      try {
        await applyActionCode(auth, oobCode);
        setStatus("ok");
        setMessage("Email verified! Redirecting…");
        setTimeout(() => router.replace("/profile"), 1200);
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message ?? "Verification failed.");
      }
    })();
  }, [mode, oobCode, router]);

  return (
    <section className="pt-20 max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Email Verification</h1>
      <p className={status === "error" ? "text-red-400" : "text-gray-300"}>{message}</p>
    </section>
  );
}

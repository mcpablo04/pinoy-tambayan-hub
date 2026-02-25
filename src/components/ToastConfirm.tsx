"use client";

import toast from "react-hot-toast";
import { AlertTriangle, Info } from "lucide-react";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

/**
 * Premium 2026 async confirmation toast.
 * const ok = await confirmToast({ title: "Delete Post?", variant: "destructive" });
 */
export function confirmToast({
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const id = `confirm-${Math.random().toString(36).slice(2)}`;

    toast.custom(
      (t) => (
        <div
          className={`
            ${t.visible ? "animate-in fade-in zoom-in-95" : "animate-out fade-out zoom-out-95"}
            pointer-events-auto w-[380px] rounded-[2rem] border border-white/10 
            bg-[#0f172a]/90 backdrop-blur-2xl p-5 shadow-2xl ring-1 ring-white/10
          `}
          role="alertdialog"
          aria-modal="true"
        >
          <div className="flex gap-4">
            {/* Icon Based on Variant */}
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              variant === "destructive" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
            }`}>
              {variant === "destructive" ? <AlertTriangle size={20} /> : <Info size={20} />}
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-white">
                {title}
              </h3>
              {description && (
                <p className="text-xs font-medium leading-relaxed text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="btn btn-ghost !px-4 !py-2 !rounded-xl text-[9px]"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className={`
                btn !px-4 !py-2 !rounded-xl text-[9px] shadow-lg
                ${variant === "destructive" 
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20" 
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"}
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        id,
        duration: Infinity,
        position: "top-center", // Better visibility for confirmations
      }
    );

    // ESC to Close
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toast.dismiss(id);
        resolve(false);
      }
    };
    window.addEventListener("keydown", onKey, { once: true });
  });
}
"use client";

import toast from "react-hot-toast";
import { useEffect } from "react";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** "default" | "destructive" affects button styles */
  variant?: "default" | "destructive";
};

/**
 * Show a toast confirmation and resolve to true/false.
 * Usage: const ok = await confirmToast({ title: "Delete?" });
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

    const handle = toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } pointer-events-auto w-[360px] rounded-xl border border-gray-700 bg-[#121722] p-4 shadow-xl`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-desc` : undefined}
        >
          <div className="space-y-2">
            <h3 id={`${id}-title`} className="text-sm font-medium text-gray-100">
              {title}
            </h3>
            {description ? (
              <p id={`${id}-desc`} className="text-xs text-gray-400">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800/60"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                variant === "destructive"
                  ? "border border-red-700 text-red-200 hover:bg-red-900/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        id,
        duration: Infinity, // stays until an action is clicked
        position: "top-right",
      }
    );

    // Optional: close on ESC
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        toast.dismiss((handle as any)?.id);
        resolve(false);
      }
    }
    window.addEventListener("keydown", onKey, { once: true });
  });
}

// src/components/Footer.tsx
"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-6 mt-8 border-t border-gray-700">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 px-4">
        <div>
          © {new Date().getFullYear()} Pinoy Tambayan Hub — All Rights Reserved
        </div>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-blue-400">About Us</Link>
          <Link href="/terms" className="hover:text-blue-400">Terms</Link>
          <Link href="/contact" className="hover:text-blue-400">Contact</Link>
          <Link href="/privacy" className="hover:text-blue-400">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

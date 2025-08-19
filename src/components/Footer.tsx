import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-4 mt-8 border-t border-gray-700">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 px-4">
        {/* Copyright */}
        <div>
          © {new Date().getFullYear()} Pinoy Tambayan Hub — All Rights Reserved
        </div>

        {/* Footer nav */}
        <div className="flex space-x-4">
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

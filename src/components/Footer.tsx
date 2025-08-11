export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-4 mt-8 border-t border-gray-700">
      <div className="max-w-6xl mx-auto text-center">
        © {new Date().getFullYear()} Pinoy Tambayan Hub — All Rights Reserved
      </div>
    </footer>
  );
}

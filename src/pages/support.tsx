// src/pages/support.tsx
import Image from "next/image";

export default function Support() {
  return (
    <section className="pt-20 max-w-4xl mx-auto px-4 sm:px-6 text-lighttext">
      <h1 className="text-3xl font-bold mb-4 text-center">💙 Support Pinoy Tambayan Hub</h1>
      <p className="text-gray-300 text-center mb-8 text-lg">
        Salamat sa suporta! 🙏 Ang simpleng donasyon mo ay malaking tulong para mapanatiling buhay
        ang ating tambayan – mula sa kwento, forums, hanggang sa OPM vibes.
      </p>

      {/* Donation QR Codes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* GCash */}
        <div className="bg-gray-800/80 rounded-xl p-6 shadow-lg text-center border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">GCash</h2>
          <a href="/images/gcash-qr.jpg" target="_blank">
            <Image
              src="/images/gcash-qr.jpg"
              alt="GCash QR Code"
              width={320}
              height={320}
              priority
              className="rounded-lg bg-white p-3 shadow-md cursor-pointer hover:scale-105 transition-transform mx-auto"
            />
          </a>
          <a
            href="/images/gcash-qr.jpg"
            download="gcash-qr.jpg"
            className="inline-block mt-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm"
          >
            ⬇ Download GCash QR
          </a>
        </div>

        {/* Maya */}
        <div className="bg-gray-800/80 rounded-xl p-6 shadow-lg text-center border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Maya</h2>
          <a href="/images/maya-qr.jpg" target="_blank">
            <Image
              src="/images/maya-qr.jpg"
              alt="Maya QR Code"
              width={320}
              height={320}
              priority
              className="rounded-lg bg-white p-3 shadow-md cursor-pointer hover:scale-105 transition-transform mx-auto"
            />
          </a>
          <a
            href="/images/maya-qr.jpg"
            download="maya-qr.jpg"
            className="inline-block mt-4 px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm"
          >
            ⬇ Download Maya QR
          </a>
        </div>
      </div>

      {/* Thank you note */}
      <p className="mt-10 text-center text-gray-400 text-sm">
        Maraming salamat sa pagtangkilik at pagsuporta sa ating online tambayan! 🇵🇭
      </p>
    </section>
  );
}

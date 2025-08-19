// src/pages/terms.tsx
"use client";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="mb-4">
        By using Pinoy Tambayan Hub, you agree to comply with these terms.
      </p>
      <ul className="list-disc list-inside space-y-2">
        <li>Respect other users and avoid abusive language.</li>
        <li>Do not share inappropriate or harmful content.</li>
        <li>We reserve the right to moderate and remove content at our discretion.</li>
        <li>Your use of this site means you accept that we may update these terms anytime.</li>
      </ul>
      <p className="mt-6 text-sm text-gray-400">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}

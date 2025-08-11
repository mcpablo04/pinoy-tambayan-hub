export default function Contact() {
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-6">📬 Contact Us</h2>
      <form className="max-w-md mx-auto space-y-4">
        <input className="w-full p-3 bg-gray-800 rounded" placeholder="Your Name" />
        <input className="w-full p-3 bg-gray-800 rounded" placeholder="Your Email" />
        <textarea className="w-full p-3 bg-gray-800 rounded" rows={4} placeholder="Message" />
        <button className="w-full bg-blue-500 py-3 rounded font-semibold hover:bg-blue-600 transition">
          Send Message
        </button>
      </form>
    </section>
  );
}

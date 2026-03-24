import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <Navbar />
      <section className="pt-32 md:pt-40 pb-14 px-4 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9f53b]/85">Connect With Us</p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold">Contact</h1>
          <p className="mt-5 text-white/70 max-w-3xl leading-relaxed">
            Reach out to the IEDC team for collaborations, events, startup support, or research inquiries.
          </p>
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-[#c9f53b]/20 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold">General Enquiries</h2>
              <p className="mt-3 text-sm text-white/75">iedc@yourcollege.edu</p>
              <p className="mt-1 text-sm text-white/75">+91 98765 43210</p>
            </div>
            <div className="rounded-2xl border border-[#c9f53b]/20 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold">Office Address</h2>
              <p className="mt-3 text-sm text-white/75 leading-6">
                Innovation & Entrepreneurship Development Cell,
                <br />
                Department of Computer Science and Engineering,
                <br />
                Campus Research Block.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
              <h2 className="text-lg font-semibold">Office Hours</h2>
              <p className="mt-3 text-sm text-white/75">Monday - Friday: 9:30 AM - 5:00 PM</p>
              <p className="mt-1 text-sm text-white/75">Saturday: 10:00 AM - 1:00 PM</p>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-7">
            <h2 className="text-xl font-semibold">Send an Inquiry</h2>
            <form className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm text-white/70">
                Full Name
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#191919] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f53b]/50"
                  placeholder="Enter your name"
                />
              </label>
              <label className="text-sm text-white/70">
                Email
                <input
                  type="email"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#191919] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f53b]/50"
                  placeholder="Enter your email"
                />
              </label>
              <label className="text-sm text-white/70 sm:col-span-2">
                Subject
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#191919] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f53b]/50"
                  placeholder="How can we help?"
                />
              </label>
              <label className="text-sm text-white/70 sm:col-span-2">
                Message
                <textarea
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#191919] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f53b]/50"
                  placeholder="Write your message"
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-[#c9f53b] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#d3ff54]"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

export default function AchievementsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <Navbar />
      <section className="pt-28 md:pt-36 pb-14 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9f53b]/85">Performance Overview</p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold">Achievements</h1>
          <p className="mt-5 max-w-3xl text-white/75 leading-relaxed">
            A snapshot of measurable outcomes from student research, faculty mentorship, publication impact, and innovation-led programs.
          </p>
        </div>
      </section>

      <section className="pb-12 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "540+", label: "Publications" },
            { value: "78", label: "Patents Filed" },
            { value: "24", label: "Funded Projects" },
            { value: "36", label: "Industry Partners" },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#c9f53b]/20 bg-linear-to-b from-[#151515] to-[#101010] p-5 sm:p-6"
            >
              <p className="text-3xl sm:text-4xl font-bold text-[#c9f53b]">{item.value}</p>
              <p className="mt-2 text-sm text-white/70">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            {
              title: "Research Excellence",
              details: "Teams presented in reputed national and international conferences with high acceptance rates.",
            },
            {
              title: "Innovation Pipeline",
              details: "Student prototypes progressed into deployable products through structured mentorship and reviews.",
            },
            {
              title: "Startup Readiness",
              details: "Multiple teams completed validation workshops, pitch clinics, and incubation readiness rounds.",
            },
            {
              title: "Awards and Recognition",
              details: "Projects secured top ranks in hackathons, innovation challenges, and design competitions.",
            },
            {
              title: "IP and Compliance",
              details: "Institution-wide support increased patent drafting quality and first-time filing success.",
            },
            {
              title: "Collaborative Growth",
              details: "Cross-domain collaboration between IoT, Cyber Security, and Blockchain tracks improved output quality.",
            },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm text-white/70 leading-6">{card.details}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}

import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <Navbar />
      <section className="pt-28 md:pt-36 pb-12 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#c9f53b]/20 bg-linear-to-br from-[#131313] to-[#0c0c0c] p-8 sm:p-10 lg:p-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9f53b]/85">About IEDC</p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
            Building a culture of
            <span className="text-[#c9f53b]"> research, innovation, and startups</span>
          </h1>
          <p className="mt-6 max-w-3xl text-base sm:text-lg text-white/75 leading-relaxed">
            The Innovation and Entrepreneurship Development Cell connects students, faculty, and industry to convert ideas into meaningful products and research outcomes. We support problem-driven learning, mentor-led incubation, and collaborative projects across departments.
          </p>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-5">
          <article className="rounded-2xl border border-white/10 bg-[#131313] p-6">
            <h2 className="text-xl font-semibold text-[#c9f53b]">Our Mission</h2>
            <p className="mt-3 text-sm text-white/75 leading-6">
              Enable students and researchers to solve real-world challenges through deep-tech experimentation and entrepreneurial thinking.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#131313] p-6">
            <h2 className="text-xl font-semibold text-[#c9f53b]">Our Vision</h2>
            <p className="mt-3 text-sm text-white/75 leading-6">
              Become a nationally recognized innovation ecosystem where research transitions to patents, products, and impactful ventures.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#131313] p-6">
            <h2 className="text-xl font-semibold text-[#c9f53b]">Our Values</h2>
            <p className="mt-3 text-sm text-white/75 leading-6">
              Curiosity, ethics, collaboration, and disciplined execution form the foundation of every initiative in the cell.
            </p>
          </article>
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-2xl sm:text-3xl font-semibold">Journey Highlights</h3>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              "Established interdisciplinary innovation clubs across CSE specializations.",
              "Built mentorship pipelines with faculty, alumni, and startup founders.",
              "Conducted hackathons, ideation bootcamps, and IP awareness workshops.",
              "Accelerated student projects into conference papers, patents, and prototypes.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#111] p-4">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c9f53b]" />
                <p className="text-sm text-white/80 leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

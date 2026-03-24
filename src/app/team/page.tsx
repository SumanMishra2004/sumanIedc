import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

const LEADERSHIP = [
  { name: "Dr. A. Raman", role: "Faculty Coordinator", area: "Innovation Strategy" },
  { name: "Prof. N. Iyer", role: "Research Mentor", area: "Publication and Grants" },
  { name: "M. Karthik", role: "Student President", area: "Operations" },
];

const WORKING_GROUPS = [
  { title: "Research and Publications", members: "12 active members" },
  { title: "Startup and Incubation", members: "9 active members" },
  { title: "Events and Outreach", members: "15 active members" },
  { title: "Technical Development", members: "18 active members" },
];

export default function TeamPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <Navbar />
      <section className="pt-32 md:pt-40 pb-14 px-4 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9f53b]/85">People and Culture</p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold">Team</h1>
          <p className="mt-5 text-white/75 max-w-3xl leading-relaxed">
            Our team combines faculty guidance with student-led execution to deliver measurable research and innovation outcomes.
          </p>
        </div>
      </section>

      <section className="pb-12 px-4 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {LEADERSHIP.map((member) => (
            <article key={member.name} className="rounded-2xl border border-[#c9f53b]/20 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold text-white">{member.name}</h2>
              <p className="mt-2 text-sm text-[#c9f53b]/90">{member.role}</p>
              <p className="mt-2 text-sm text-white/70">{member.area}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold">Working Groups</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WORKING_GROUPS.map((group) => (
              <article key={group.title} className="rounded-xl border border-white/10 bg-[#111] p-5">
                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                <p className="mt-2 text-sm text-white/70">{group.members}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

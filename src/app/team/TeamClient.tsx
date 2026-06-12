"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Linkedin, Github, Mail, Shield, GraduationCap } from "lucide-react";
import Footer from "@/components/home/Footer";
import { urlFor } from "../../../sanity/lib/image";
import type { SanityTeamMember, TeamPageContent } from "../../../sanity/lib/queries";

// ─── DB Faculty (from Prisma) ─────────────────────────────────────────────────
interface DbFacultyMember {
  name: string;
  email: string | null;
  image: string | null;
  role: string;
  designation: string | null;
  department: string | null;
  areasOfExpertise: string[];
  linkedinLink: string | null;
  githubLink: string | null;
}

// ─── Fallback mock faculty (shown when DB has no data yet) ────────────────────
const MOCK_FACULTY: DbFacultyMember[] = [
  {
    name: "Dr. Suman Mishra",
    email: "suman.m@iedc.edu.in",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250&h=250",
    role: "FACULTY",
    designation: "IEDC Coordinator & Assoc. Professor",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["IoT Systems", "Embedded Sensors", "Edge Security"],
    linkedinLink: "https://linkedin.com",
    githubLink: "https://github.com",
  },
  {
    name: "Prof. Rajesh Kumar",
    email: "rajesh.k@iedc.edu.in",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250&h=250",
    role: "FACULTY",
    designation: "Senior Advisor & Professor",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["Distributed Ledgers", "Smart Grids", "Cryptography"],
    linkedinLink: "https://linkedin.com",
    githubLink: "https://github.com",
  },
];

// ─── Fallback Sanity student members ─────────────────────────────────────────
const MOCK_STUDENTS: SanityTeamMember[] = [
  {
    _id: "sm1",
    name: "Abhishek Sen",
    designation: "Student CEO",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["Project Management", "Product Strategy", "Embedded Coding"],
    photo: null,
    email: "abhishek.s@iedc.edu.in",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
    orderRank: 1,
  },
  {
    _id: "sm2",
    name: "Ananya Roy",
    designation: "Research Lead",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["Blockchain Sharding", "Smart Contracts", "Data Security"],
    photo: null,
    email: "ananya.r@iedc.edu.in",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
    orderRank: 2,
  },
  {
    _id: "sm3",
    name: "Siddharth Das",
    designation: "Hardware Prototype Specialist",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["LoRaWAN Arrays", "PCB Design", "Microfluidics"],
    photo: null,
    email: "sid.d@iedc.edu.in",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
    orderRank: 3,
  },
];

const DEFAULT_PAGE_CONTENT: TeamPageContent = {
  eyebrow: "◆ INTELLECT GROUP ◆",
  heading: "Meet Our Team",
  description:
    "Bringing together specialized faculty mentorship and enthusiastic student innovators to bridge the gap between academic projects and industrial breakthroughs.",
};

// ─── Helper: Get image URL for a Sanity member ────────────────────────────────
function getSanityMemberImage(member: SanityTeamMember): string | null {
  if (!member.photo) return null;
  return urlFor(member.photo).width(250).height(250).fit("crop").url();
}

interface TeamClientProps {
  dbFaculty: DbFacultyMember[];
  sanityStudents?: SanityTeamMember[] | null;
  pageContent?: TeamPageContent | null;
}

export default function TeamClient({ dbFaculty, sanityStudents, pageContent }: TeamClientProps) {
  const content = pageContent ?? DEFAULT_PAGE_CONTENT;

  const advisors = useMemo(() => {
    const dbNames = new Set(dbFaculty.map((u) => u.name));
    const finalMock = MOCK_FACULTY.filter((item) => !dbNames.has(item.name));
    return [...dbFaculty, ...finalMock];
  }, [dbFaculty]);

  const students = useMemo<SanityTeamMember[]>(() => {
    if (sanityStudents && sanityStudents.length > 0) return sanityStudents;
    return MOCK_STUDENTS;
  }, [sanityStudents]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c0c] text-[#f0ede6] overflow-hidden">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(201,245,59,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Gradient Blobs */}
      <div className="absolute top-[10%] left-[-8%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-violet-600/10 to-transparent" />
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">

        {/* Title */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            {content.eyebrow}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {/* Highlight last word in accent colour */}
            {(() => {
              const words = content.heading.split(" ");
              const last = words.pop();
              return (
                <>
                  {words.join(" ")} <span className="text-[#c9f53b]">{last}</span>
                </>
              );
            })()}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
          <p className="max-w-2xl mx-auto text-sm text-white/50 leading-relaxed font-light">
            {content.description}
          </p>
        </div>

        {/* ── Section 1: Faculty Advisors ── */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <Shield className="w-5 h-5 text-[#c9f53b]" />
            <h2
              className="text-2xl font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Faculty Advisors &amp; Mentors
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advisors.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#0e0e0e]/50 border border-white/5 hover:border-[#c9f53b]/30 rounded-2xl p-6 backdrop-blur-xl group relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-full p-1 border-2 border-white/10 group-hover:border-[#c9f53b] transition-all duration-300 mb-6 overflow-hidden relative">
                  {member.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#c9f53b]/10 flex items-center justify-center text-[#c9f53b] font-bold text-xl uppercase">
                      {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                  )}
                </div>

                <h3
                  className="text-lg font-bold text-white mb-1 group-hover:text-[#c9f53b] transition-colors"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {member.name}
                </h3>
                <p className="text-xs text-[#c9f53b] font-medium tracking-wide uppercase mb-1">
                  {member.designation}
                </p>
                <p className="text-[11px] text-white/40 mb-4 font-light">{member.department}</p>

                <div className="flex flex-wrap gap-1 justify-center mb-6">
                  {member.areasOfExpertise.map((exp) => (
                    <span key={exp} className="text-[9px] text-white/50 border border-white/5 px-2 py-0.5 rounded bg-white/[0.01]">
                      {exp}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5 w-full justify-center">
                  {member.linkedinLink && (
                    <a href={member.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#c9f53b] transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.githubLink && (
                    <a href={member.githubLink} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#c9f53b] transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-white/40 hover:text-[#c9f53b] transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Student Committee (from Sanity) ── */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <GraduationCap className="w-5 h-5 text-violet-400" />
            <h2
              className="text-2xl font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Student Executive Committee
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {students.map((member, idx) => {
              const photoUrl = getSanityMemberImage(member);
              return (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-[#0e0e0e]/50 border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 backdrop-blur-xl group relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full p-1 border-2 border-white/10 group-hover:border-violet-400 transition-all duration-300 mb-6 overflow-hidden relative">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xl uppercase">
                        {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                    )}
                  </div>

                  <h3
                    className="text-lg font-bold text-white mb-1 group-hover:text-violet-400 transition-colors"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {member.name}
                  </h3>
                  <p className="text-xs text-violet-400 font-medium tracking-wide uppercase mb-1">
                    {member.designation}
                  </p>
                  <p className="text-[11px] text-white/40 mb-4 font-light">{member.department}</p>

                  <div className="flex flex-wrap gap-1 justify-center mb-6">
                    {member.areasOfExpertise.map((exp) => (
                      <span key={exp} className="text-[9px] text-white/50 border border-white/5 px-2 py-0.5 rounded bg-white/[0.01]">
                        {exp}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5 w-full justify-center">
                    {member.linkedinUrl && (
                      <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-violet-400 transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.githubUrl && (
                      <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-violet-400 transition-colors">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="text-white/40 hover:text-violet-400 transition-colors">
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

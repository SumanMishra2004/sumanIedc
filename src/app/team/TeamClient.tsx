"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Linkedin, Github, Mail, Shield, Award, GraduationCap } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Member {
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

const MOCK_TEAM: Member[] = [
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
  {
    name: "Abhishek Sen",
    email: "abhishek.s@iedc.edu.in",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250&h=250",
    role: "STUDENT_LEAD",
    designation: "Student CEO",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["Project Management", "Product Strategy", "Embedded Coding"],
    linkedinLink: "https://linkedin.com",
    githubLink: "https://github.com",
  },
  {
    name: "Ananya Roy",
    email: "ananya.r@iedc.edu.in",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250&h=250",
    role: "STUDENT_LEAD",
    designation: "Research Lead",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["Blockchain Sharding", "Smart Contracts", "Data Security"],
    linkedinLink: "https://linkedin.com",
    githubLink: "https://github.com",
  },
  {
    name: "Siddharth Das",
    email: "sid.d@iedc.edu.in",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250&h=250",
    role: "STUDENT_LEAD",
    designation: "Hardware Prototype Specialist",
    department: "Computer Science & Engineering",
    areasOfExpertise: ["LoRaWAN Arrays", "PCB Design", "Microfluidics"],
    linkedinLink: "https://linkedin.com",
    githubLink: "https://github.com",
  }
];

export default function TeamClient({ dbFaculty }: { dbFaculty: Member[] }) {
  const advisors = useMemo(() => {
    // Collect faculty from DB and fallback
    const dbFac = dbFaculty.map((item) => ({ ...item, isDb: true }));
    const mockFac = MOCK_TEAM.filter((item) => item.role === "FACULTY").map((item) => ({ ...item, isDb: false }));
    
    // Remove mock items that have the same name as database entries
    const dbNames = new Set(dbFac.map((u) => u.name));
    const finalMock = mockFac.filter((item) => !dbNames.has(item.name));

    return [...dbFac, ...finalMock];
  }, [dbFaculty]);

  const students = useMemo(() => {
    return MOCK_TEAM.filter((item) => item.role === "STUDENT_LEAD");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c0c] text-[#f0ede6] overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
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
            ◆ INTELLECT GROUP ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Meet Our <span className="text-[#c9f53b]">Team</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
          <p className="max-w-2xl mx-auto text-sm text-white/50 leading-relaxed font-light">
            Bringing together specialized faculty mentorship and enthusiastic student innovators to bridge the gap between academic projects and industrial breakthroughs.
          </p>
        </div>

        {/* Section 1: Faculty Advisors */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <Shield className="w-5 h-5 text-[#c9f53b]" />
            <h2 className="text-2xl font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
                {/* Visual Avatar frame */}
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
                      {member.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#c9f53b] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {member.name}
                </h3>
                <p className="text-xs text-[#c9f53b] font-medium tracking-wide uppercase mb-1">
                  {member.designation}
                </p>
                <p className="text-[11px] text-white/40 mb-4 font-light">
                  {member.department}
                </p>

                {/* Expertise Badges */}
                <div className="flex flex-wrap gap-1 justify-center mb-6">
                  {member.areasOfExpertise.map((exp) => (
                    <span 
                      key={exp}
                      className="text-[9px] text-white/50 border border-white/5 px-2 py-0.5 rounded bg-white/[0.01]"
                    >
                      {exp}
                    </span>
                  ))}
                </div>

                {/* Social links */}
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

        {/* Section 2: Student Committee */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <GraduationCap className="w-5 h-5 text-violet-400" />
            <h2 className="text-2xl font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Student Executive Committee
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {students.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#0e0e0e]/50 border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 backdrop-blur-xl group relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center"
              >
                {/* Visual Avatar frame */}
                <div className="w-24 h-24 rounded-full p-1 border-2 border-white/10 group-hover:border-violet-400 transition-all duration-300 mb-6 overflow-hidden relative">
                  {member.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xl uppercase">
                      {member.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-400 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {member.name}
                </h3>
                <p className="text-xs text-violet-400 font-medium tracking-wide uppercase mb-1">
                  {member.designation}
                </p>
                <p className="text-[11px] text-white/40 mb-4 font-light">
                  {member.department}
                </p>

                {/* Expertise Badges */}
                <div className="flex flex-wrap gap-1 justify-center mb-6">
                  {member.areasOfExpertise.map((exp) => (
                    <span 
                      key={exp}
                      className="text-[9px] text-white/50 border border-white/5 px-2 py-0.5 rounded bg-white/[0.01]"
                    >
                      {exp}
                    </span>
                  ))}
                </div>

                {/* Social links */}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5 w-full justify-center">
                  {member.linkedinLink && (
                    <a href={member.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-violet-400 transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.githubLink && (
                    <a href={member.githubLink} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-violet-400 transition-colors">
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
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

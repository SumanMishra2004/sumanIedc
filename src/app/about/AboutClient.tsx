"use client";

import { motion } from "motion/react";
import { Lightbulb, Rocket, Users, Target, Calendar, Award, ShieldAlert, Cpu } from "lucide-react";
import Footer from "@/components/home/Footer";

const PILLARS = [
  {
    icon: Lightbulb,
    title: "Innovation",
    desc: "Nurturing creative ideas and translation of academic projects into real-world technology solutions.",
    color: "rgba(201, 245, 59, 0.15)",
  },
  {
    icon: Rocket,
    title: "Incubation",
    desc: "Providing seed support, workspace, and business guidance to student-led start-ups.",
    color: "rgba(124, 58, 237, 0.15)",
  },
  {
    icon: Cpu,
    title: "Research",
    desc: "Promoting high-impact publications, IP filings, patents, and hardware prototyping.",
    color: "rgba(219, 39, 119, 0.15)",
  },
  {
    icon: Users,
    title: "Collaboration",
    desc: "Bridging the gap between academia and leading tech industries to build a robust ecosystem.",
    color: "rgba(59, 130, 246, 0.15)",
  },
];

const TIMELINE = [
  {
    year: "2022",
    title: "Inception & Foundation",
    desc: "Established IEDC Cell to nurture campus startup culture and tech innovation.",
  },
  {
    year: "2023",
    title: "Research Lab Launch",
    desc: "Set up the IoT & Cybersecurity Sandbox with state-of-the-art developer hardware.",
  },
  {
    year: "2024",
    title: "First Patent Filed",
    desc: "Student project on Blockchain-based supply chain safety filed and published.",
  },
  {
    year: "2025",
    title: "Incubating Excellence",
    desc: "Secured external funding for 3 campus-born startups and expanded to 100+ active members.",
  },
];

const STATS = [
  { value: "120+", label: "Research Journals" },
  { value: "15+", label: "Patents & IPs" },
  { value: "10M+", label: "Grant Funding" },
  { value: "250+", label: "Students Trained" },
];

export default function AboutClient() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c0c] text-[#f0ede6] overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(201,245,59,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      
      {/* Ambient Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-violet-600/10 to-transparent" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />
      
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Section Title */}
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ OUR JOURNEY ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Innovation &amp; <span className="text-[#c9f53b]">Entrepreneurship</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-[2px] w-24 bg-[#c9f53b]/60 mx-auto my-6"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto text-lg text-white/60 leading-relaxed font-light"
          >
            We empower students, faculty, and research enthusiasts to convert state-of-the-art computational research into viable prototypes and commercial startups.
          </motion.p>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#c9f53b]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#c9f53b]/10 text-[#c9f53b] mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Our Vision</h3>
            <p className="text-white/60 leading-relaxed font-light">
              To be a premier hub of innovation, research excellence, and technological entrepreneurship. We aspire to build an ecosystem where academic learning meets commercial reality, fostering solutions that address local and global socioeconomic challenges.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-400 mb-6">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 uppercase tracking-wide text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Our Mission</h3>
            <p className="text-white/60 leading-relaxed font-light">
              We dedicatedly provide resources, active mentorship, funding channels, and technical infrastructure. By organizing hackathons, research sprints, and IP clinics, we systematically convert bold ideas into published research, patents, and incubated ventures.
            </p>
          </motion.div>
        </div>

        {/* Pillars Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold uppercase tracking-wide text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Core <span className="text-[#c9f53b]">Pillars</span>
            </h2>
            <div className="h-0.5 w-16 bg-[#c9f53b]/50 mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="p-6 rounded-xl border border-white/5 bg-[#0e0e0e] hover:border-[#c9f53b]/30 transition-all duration-300 relative group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-5 text-[#c9f53b]" style={{ backgroundColor: item.color }}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-24 relative p-10 rounded-3xl border border-[#c9f53b]/10 bg-white/[0.01] backdrop-blur-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c9f53b]/5 to-transparent pointer-events-none" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
            {STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="text-4xl sm:text-5xl font-extrabold text-[#c9f53b] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/55 font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold uppercase tracking-wide text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Milestones &amp; <span className="text-[#c9f53b]">History</span>
            </h2>
            <div className="h-0.5 w-16 bg-[#c9f53b]/50 mx-auto mt-3" />
          </div>

          <div className="relative border-l border-white/10 ml-4 md:ml-32 py-4">
            {TIMELINE.map((item, idx) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="mb-12 last:mb-0 pl-8 relative"
              >
                {/* Bullet node */}
                <div className="absolute left-0 -translate-x-[9px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-[#c9f53b] bg-[#0c0c0c] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9f53b]" />
                </div>
                
                {/* Year tag - absolute on md+ screens */}
                <div className="md:absolute md:right-full md:mr-10 md:top-1 text-[#c9f53b] font-bold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.year}
                </div>
                
                <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed max-w-2xl font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

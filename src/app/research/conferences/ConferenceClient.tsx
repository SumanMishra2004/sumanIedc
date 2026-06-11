"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, ExternalLink, Calendar, Users, MapPin, Video, Award } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Author {
  name: string;
  role: string;
}

interface ConferenceItem {
  id: string;
  conferenceName: string;
  paperName: string;
  mode: string;
  conferenceDate: string | Date | null;
  paperLink: string | null;
  abstract: string | null;
  keywords: string[];
  authors: Author[];
}

const MOCK_CONFERENCES: ConferenceItem[] = [
  {
    id: "conf-1",
    conferenceName: "International Conference on VLSI & Embedded Systems (IVES 2025)",
    paperName: "Edge-Computing Enabled IoT Node for Real-time Soil Nitrate Detection",
    mode: "OFFLINE",
    conferenceDate: "2025-04-18",
    paperLink: "https://ieee-ives.org",
    abstract: "This paper reports the design and testing of a custom low-cost electrochemical node utilizing LoRaWAN connectivity. The node calculates nitrate content dynamically...",
    keywords: ["Edge Computing", "IoT Node", "Sensors", "Agriculture"],
    authors: [
      { name: "Dr. Suman Mishra", role: "Faculty" },
      { name: "Siddharth Das", role: "Student" }
    ]
  },
  {
    id: "conf-2",
    conferenceName: "Global Conference on Cyber Security & Cryptography (GCC 2025)",
    paperName: "Mitigating Sybil Attacks in Decentralized Identity Schemes via Proof-of-Location",
    mode: "ONLINE",
    conferenceDate: "2025-02-14",
    paperLink: "https://globalcyberconf.org",
    abstract: "We evaluate Sybil vulnerabilities in decentralized identifier (DID) registers. We propose a location-proving verification protocol based on signal round-trip-time...",
    keywords: ["Sybil Attack", "Identity", "Location Proof", "Cyber Security"],
    authors: [
      { name: "Prof. Rajesh Kumar", role: "Faculty" },
      { name: "Neha Sen", role: "Student" }
    ]
  },
  {
    id: "conf-3",
    conferenceName: "IEEE International Conference on Blockchain (Blockchain-2024)",
    paperName: "A High-Throughput Sharding Architecture for Logistics Ledgers",
    mode: "HYBRID",
    conferenceDate: "2024-12-05",
    paperLink: "https://ieee-blockchain.org",
    abstract: "Traditional blockchains fail in logistics supply chains due to network bottlenecks. We design a hierarchical sharding model that partitions logs into geo-zones...",
    keywords: ["Blockchain", "Sharding", "Logistics", "Consensus Speed"],
    authors: [
      { name: "Velocium IoT Team", role: "Faculty" },
      { name: "Sourav Paul", role: "Student" }
    ]
  }
];

export default function ConferenceClient({ initialConferences }: { initialConferences: ConferenceItem[] }) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");

  const conferences = useMemo(() => {
    return initialConferences.length > 0 ? initialConferences : MOCK_CONFERENCES;
  }, [initialConferences]);

  const filteredConferences = useMemo(() => {
    return conferences.filter((item) => {
      const matchesSearch =
        item.paperName.toLowerCase().includes(search.toLowerCase()) ||
        item.conferenceName.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())) ||
        item.authors.some((a) => a.name.toLowerCase().includes(search.toLowerCase()));

      const matchesMode = modeFilter === "ALL" || item.mode === modeFilter;

      return matchesSearch && matchesMode;
    });
  }, [conferences, search, modeFilter]);

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
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-indigo-500/5 to-transparent" />
      <div className="absolute bottom-[10%] right-[-5%] w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ ACADEMIC CONFERENCES ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Conference <span className="text-[#c9f53b]">Papers</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-[#0e0e0e]/80 border border-white/5 rounded-2xl p-6 mb-12 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
            <input
              type="text"
              placeholder="Search papers, conference name, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Mode Select */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white/70 focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-[#0c0c0c]">All Modes</option>
              <option value="ONLINE" className="bg-[#0c0c0c]">Online</option>
              <option value="OFFLINE" className="bg-[#0c0c0c]">Offline</option>
              <option value="HYBRID" className="bg-[#0c0c0c]">Hybrid</option>
            </select>
          </div>
        </div>

        {/* Papers List */}
        <div className="grid grid-cols-1 gap-6 mb-16">
          {filteredConferences.length > 0 ? (
            filteredConferences.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                className="bg-[#0e0e0e]/50 border border-white/5 hover:border-[#c9f53b]/20 transition-colors duration-300 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden"
              >
                {/* Background glow hover effect */}
                <div className="absolute inset-0 bg-[#c9f53b]/[0.01] opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Metadata badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-[#c9f53b] bg-[#c9f53b]/10 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                    {item.mode === "ONLINE" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {item.mode}
                  </span>
                </div>

                {/* Paper Name */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 hover:text-[#c9f53b] transition-colors leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.paperName}
                </h3>

                {/* Conference Name & Date */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-white/45 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#c9f53b]/80" />
                    <span className="font-semibold text-white/70">{item.conferenceName}</span>
                  </div>
                  {item.conferenceDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.conferenceDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                    </div>
                  )}
                </div>

                {/* Authors */}
                <div className="flex flex-wrap gap-2 items-center mb-5 border-t border-white/5 pt-4">
                  <span className="text-xs text-white/30 font-medium mr-1 uppercase tracking-wider">Authors:</span>
                  {item.authors.map((author, aIdx) => (
                    <span
                      key={aIdx}
                      className="text-xs bg-white/[0.02] border border-white/10 rounded-md px-2 py-0.5 text-white/70"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {author.name}
                      <span className="text-[9px] text-[#c9f53b]/70 font-semibold uppercase ml-1.5 px-1 bg-[#c9f53b]/10 rounded">
                        {author.role}
                      </span>
                    </span>
                  ))}
                </div>

                {/* Abstract snippet */}
                {item.abstract && (
                  <p className="text-sm text-white/60 leading-relaxed font-light mb-6">
                    {item.abstract}
                  </p>
                )}

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {item.keywords.map((word) => (
                    <span key={word} className="text-[10px] text-white/40 border border-white/5 px-2 py-0.5 rounded bg-white/[0.01]">
                      #{word}
                    </span>
                  ))}
                </div>

                {/* Links */}
                {item.paperLink && (
                  <div className="flex items-center gap-4">
                    <a
                      href={item.paperLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c9f53b] hover:underline"
                    >
                      View Proceeding <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40">No conference papers found matching the filters.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}

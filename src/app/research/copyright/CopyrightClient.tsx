"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Calendar, Users, FileText, CheckCircle, Shield } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Author {
  name: string;
  role: string;
}

interface CopyrightItem {
  id: string;
  title: string;
  regNo: string;
  copyrightStatus: string;
  dateOfFiling: string | Date | null;
  dateOfGrant: string | Date | null;
  abstract: string | null;
  authors: Author[];
}

const MOCK_COPYRIGHTS: CopyrightItem[] = [
  {
    id: "cop-1",
    title: "SENS-NET: Real-Time Communication Middleware for IoT Wireless Sensor Arrays (Software Code)",
    regNo: "SW-18290/2024",
    copyrightStatus: "PUBLISHED",
    dateOfFiling: "2024-03-01",
    dateOfGrant: "2024-09-15",
    abstract: "A low-latency, packet-switched routing algorithm optimized for embedded systems. Ensures zero-data-loss buffering during sensor cluster reconventions...",
    authors: [
      { name: "Dr. Suman Mishra", role: "Faculty" },
      { name: "Sourav Paul", role: "Student" }
    ]
  },
  {
    id: "cop-2",
    title: "SECURE-LEDGER: Multi-Agent Consensual System for Distributed Power Micro-Grids (Software Code)",
    regNo: "SW-19342/2025",
    copyrightStatus: "APPROVED",
    dateOfFiling: "2025-02-10",
    dateOfGrant: "2025-04-05",
    abstract: "A smart-contract script collection written in Solidity for micro-billing and dynamic voltage redistribution logs inside neighborhood energy cooperatives...",
    authors: [
      { name: "Prof. Rajesh Kumar", role: "Faculty" },
      { name: "Neha Sen", role: "Student" }
    ]
  }
];

export default function CopyrightClient({ initialCopyrights }: { initialCopyrights: CopyrightItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const copyrights = useMemo(() => {
    return initialCopyrights.length > 0 ? initialCopyrights : MOCK_COPYRIGHTS;
  }, [initialCopyrights]);

  const filteredCopyrights = useMemo(() => {
    return copyrights.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.regNo.toLowerCase().includes(search.toLowerCase()) ||
        item.authors.some((a) => a.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || item.copyrightStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [copyrights, search, statusFilter]);

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
      <div className="absolute top-[25%] left-[-8%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-pink-500/5 to-transparent" />
      <div className="absolute bottom-[10%] right-[-10%] w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ WORK REGISTRATIONS ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Software &amp; <span className="text-[#c9f53b]">Copyrights</span>
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
              placeholder="Search copyrights, registration numbers, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white/70 focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-[#0c0c0c]">All Statuses</option>
              <option value="PUBLISHED" className="bg-[#0c0c0c]">Published</option>
              <option value="APPROVED" className="bg-[#0c0c0c]">Approved</option>
              <option value="SUBMITTED" className="bg-[#0c0c0c]">Submitted / Filed</option>
            </select>
          </div>
        </div>

        {/* Copyrights List */}
        <div className="grid grid-cols-1 gap-6 mb-16">
          {filteredCopyrights.length > 0 ? (
            filteredCopyrights.map((item, idx) => (
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
                    <Shield className="w-3 h-3" />
                    {item.copyrightStatus}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 hover:text-[#c9f53b] transition-colors leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.title}
                </h3>

                {/* Registration Details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-white/45 mb-4">
                  <div>
                    <span className="text-white/30 mr-1.5 uppercase font-medium">Diary / Reg No:</span>
                    <span className="font-mono text-[#c9f53b] font-bold">{item.regNo}</span>
                  </div>
                  {item.dateOfFiling && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Filing Date: {new Date(item.dateOfFiling).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                    </div>
                  )}
                  {item.dateOfGrant && (
                    <div className="flex items-center gap-1 text-[#c9f53b]/85">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Registration Date: {new Date(item.dateOfGrant).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                    </div>
                  )}
                </div>

                {/* Authors */}
                <div className="flex flex-wrap gap-2 items-center mb-5 border-t border-white/5 pt-4">
                  <span className="text-xs text-white/30 font-medium mr-1 uppercase tracking-wider">Creators:</span>
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
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40">No copyrights found matching the filters.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}

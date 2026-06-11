"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, ExternalLink, Calendar, Users, FileText, CheckCircle } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Inventor {
  name: string;
  role: string;
}

interface PatentItem {
  id: string;
  title: string;
  patentStatus: string;
  applicationNo: string | null;
  grantedPatentNo: string | null;
  filingDate: string | Date | null;
  grantDate: string | Date | null;
  patentLink: string | null;
  abstract: string | null;
  keywords: string[];
  inventors: Inventor[];
}

const MOCK_PATENTS: PatentItem[] = [
  {
    id: "pat-1",
    title: "An IoT-Based Wearable Device for Continuous Non-Invasive Biochemical Nitrate Sensing",
    patentStatus: "GRANTED",
    applicationNo: "202431098765 A",
    grantedPatentNo: "IN 456789 B",
    filingDate: "2024-02-18",
    grantDate: "2025-05-10",
    patentLink: "https://ipindia.gov.in",
    abstract: "The present invention discloses a portable wearable sensor array that communicates wirelessly via BLE/LoRa to report nitrate concentrations in sweat/fluids using an automated micro-pump system...",
    keywords: ["IoT Wearables", "Biosensors", "Electrochemistry", "Microfluidics"],
    inventors: [
      { name: "Dr. Suman Mishra", role: "Faculty" },
      { name: "Siddharth Das", role: "Student" }
    ]
  },
  {
    id: "pat-2",
    title: "A Cryptographic System for Secure Storage and Sharded Validation of Health Records",
    patentStatus: "SUBMITTED",
    applicationNo: "202531012345 A",
    grantedPatentNo: null,
    filingDate: "2025-01-22",
    grantDate: null,
    patentLink: "https://ipindia.gov.in",
    abstract: "A blockchain-driven identity registry mapping cryptographically sharded medical logs to decentralized identifiers (DIDs), enabling secure patient-authorized decryption streams...",
    keywords: ["DID", "Healthcare Blockchain", "Cryptography", "Sharding"],
    inventors: [
      { name: "Prof. Rajesh Kumar", role: "Faculty" },
      { name: "Ananya Roy", role: "Student" }
    ]
  }
];

export default function PatentClient({ initialPatents }: { initialPatents: PatentItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const patents = useMemo(() => {
    return initialPatents.length > 0 ? initialPatents : MOCK_PATENTS;
  }, [initialPatents]);

  const filteredPatents = useMemo(() => {
    return patents.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())) ||
        item.inventors.some((inv) => inv.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || item.patentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patents, search, statusFilter]);

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
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />
      <div className="absolute bottom-[15%] left-[-8%] w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-violet-500/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ INTELLECTUAL PROPERTY ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Patents &amp; <span className="text-[#c9f53b]">IP Assets</span>
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
              placeholder="Search patents, application numbers, inventors..."
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
              <option value="ALL" className="bg-[#0c0c0c]">All Patents</option>
              <option value="GRANTED" className="bg-[#0c0c0c]">Granted Patents</option>
              <option value="SUBMITTED" className="bg-[#0c0c0c]">Submitted / Filed</option>
              <option value="UNDER_REVIEW" className="bg-[#0c0c0c]">Under Review</option>
            </select>
          </div>
        </div>

        {/* Patents List */}
        <div className="grid grid-cols-1 gap-6 mb-16">
          {filteredPatents.length > 0 ? (
            filteredPatents.map((item, idx) => (
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
                  <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase flex items-center gap-1 ${
                    item.patentStatus === "GRANTED" 
                      ? "text-[#c9f53b] bg-[#c9f53b]/10" 
                      : "text-violet-400 bg-violet-500/10"
                  }`}>
                    {item.patentStatus === "GRANTED" ? <CheckCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {item.patentStatus}
                  </span>
                </div>

                {/* Patent Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 hover:text-[#c9f53b] transition-colors leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.title}
                </h3>

                {/* Application Details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-white/45 mb-4">
                  {item.applicationNo && (
                    <div>
                      <span className="text-white/30 mr-1.5 uppercase font-medium">Application No:</span>
                      <span className="font-mono text-white/70">{item.applicationNo}</span>
                    </div>
                  )}
                  {item.grantedPatentNo && (
                    <div>
                      <span className="text-white/30 mr-1.5 uppercase font-medium text-[#c9f53b]/80">Patent No:</span>
                      <span className="font-mono text-[#c9f53b] font-bold">{item.grantedPatentNo}</span>
                    </div>
                  )}
                  {item.filingDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Filing Date: {new Date(item.filingDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                    </div>
                  )}
                  {item.grantDate && (
                    <div className="flex items-center gap-1 text-[#c9f53b]/85">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Grant Date: {new Date(item.grantDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                    </div>
                  )}
                </div>

                {/* Inventors */}
                <div className="flex flex-wrap gap-2 items-center mb-5 border-t border-white/5 pt-4">
                  <span className="text-xs text-white/30 font-medium mr-1 uppercase tracking-wider">Inventors:</span>
                  {item.inventors.map((inv, iIdx) => (
                    <span
                      key={iIdx}
                      className="text-xs bg-white/[0.02] border border-white/10 rounded-md px-2 py-0.5 text-white/70"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {inv.name}
                      <span className="text-[9px] text-[#c9f53b]/70 font-semibold uppercase ml-1.5 px-1 bg-[#c9f53b]/10 rounded">
                        {inv.role}
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
                {item.patentLink && (
                  <div className="flex items-center gap-4">
                    <a
                      href={item.patentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c9f53b] hover:underline"
                    >
                      View Patent Registry <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40">No patents found matching the filters.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}

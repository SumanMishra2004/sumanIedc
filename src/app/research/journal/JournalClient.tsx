"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, ExternalLink, Calendar, Award, BookOpen, Layers } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Author {
  name: string;
  role: string;
}

interface JournalItem {
  id: string;
  title: string;
  journalName: string;
  indexing: string;
  quartile: string;
  impactFactor: number | null;
  doi: string | null;
  paperLink: string | null;
  publicationDate: string | Date | null;
  scope: string;
  abstract: string | null;
  keywords: string[];
  authors: Author[];
}

const MOCK_JOURNALS: JournalItem[] = [
  {
    id: "mock-1",
    title: "Decentralized Access Control in IoT Edge Systems using Hyperledger Fabric",
    journalName: "IEEE Internet of Things Journal",
    indexing: "SCOPUS",
    quartile: "Q1",
    impactFactor: 8.2,
    doi: "10.1109/JIOT.2025.3214567",
    paperLink: "https://ieeexplore.ieee.org",
    publicationDate: "2025-03-15",
    scope: "INTERNATIONAL",
    abstract: "This paper presents a light-weight access control framework for heterogeneous IoT edge nodes. We construct a secure consensus scheme using Hyperledger Fabric to store authentication policies...",
    keywords: ["IoT", "Blockchain", "Smart Contracts", "Access Control"],
    authors: [
      { name: "Dr. Suman Mishra", role: "Faculty" },
      { name: "Ananya Roy", role: "Student" }
    ]
  },
  {
    id: "mock-2",
    title: "Deep Learning based Intrusion Detection for Cybersecurity in Automated Smart Grids",
    journalName: "Elsevier Computers & Security",
    indexing: "SCIE",
    quartile: "Q1",
    impactFactor: 5.6,
    doi: "10.1016/j.cose.2025.103112",
    paperLink: "https://sciencedirect.com",
    publicationDate: "2025-01-10",
    scope: "INTERNATIONAL",
    abstract: "Smart grid infrastructure is susceptible to false data injection attacks. We propose an ensemble CNN-GRU model that scans communication logs at substations to classify malicious patterns...",
    keywords: ["Cybersecurity", "Deep Learning", "Intrusion Detection", "Smart Grid"],
    authors: [
      { name: "Prof. Rajesh Kumar", role: "Faculty" },
      { name: "Vikram Sen", role: "Student" }
    ]
  },
  {
    id: "mock-3",
    title: "Optimized Consensus Algorithm for Private Blockchains in Resource-Constrained Environments",
    journalName: "Springer Journal of Grid Computing",
    indexing: "SCOPUS",
    quartile: "Q2",
    impactFactor: 3.8,
    doi: "10.1007/s10723-024-09721-y",
    paperLink: "https://link.springer.com",
    publicationDate: "2024-11-20",
    scope: "INTERNATIONAL",
    abstract: "Classical PBFT consensus suffers high communication overhead. We introduce an optimized leader-election method based on trust factors that decreases latency by 35% in small networks...",
    keywords: ["Consensus Protocol", "PBFT", "Resource-Constrained Devices", "Latency"],
    authors: [
      { name: "Velocium IoT Team", role: "Faculty" },
      { name: "Sourav Paul", role: "Student" }
    ]
  }
];

export default function JournalClient({ initialJournals }: { initialJournals: JournalItem[] }) {
  const [search, setSearch] = useState("");
  const [indexingFilter, setIndexingFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  const journals = useMemo(() => {
    return initialJournals.length > 0 ? initialJournals : MOCK_JOURNALS;
  }, [initialJournals]);

  const filteredJournals = useMemo(() => {
    return journals.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.journalName.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())) ||
        item.authors.some((a) => a.name.toLowerCase().includes(search.toLowerCase()));

      const matchesIndexing = indexingFilter === "ALL" || item.indexing === indexingFilter;
      const matchesScope = scopeFilter === "ALL" || item.scope === scopeFilter;

      return matchesSearch && matchesIndexing && matchesScope;
    });
  }, [journals, search, indexingFilter, scopeFilter]);

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
      <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />
      <div className="absolute bottom-[20%] left-[-5%] w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-pink-500/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ RESEARCH PUBLICATIONS ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Journal <span className="text-[#c9f53b]">Publications</span>
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
              placeholder="Search by title, authors, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Indexing Select */}
            <select
              value={indexingFilter}
              onChange={(e) => setIndexingFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white/70 focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-[#0c0c0c]">All Indexing</option>
              <option value="SCOPUS" className="bg-[#0c0c0c]">SCOPUS</option>
              <option value="SCIE" className="bg-[#0c0c0c]">SCIE</option>
              <option value="SCI" className="bg-[#0c0c0c]">SCI</option>
              <option value="UGC_CARE" className="bg-[#0c0c0c]">UGC CARE</option>
              <option value="IEEE_XPLORE" className="bg-[#0c0c0c]">IEEE Xplore</option>
            </select>

            {/* Scope Select */}
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white/70 focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-[#0c0c0c]">All Scopes</option>
              <option value="INTERNATIONAL" className="bg-[#0c0c0c]">International</option>
              <option value="NATIONAL" className="bg-[#0c0c0c]">National</option>
            </select>
          </div>
        </div>

        {/* Publications List */}
        <div className="grid grid-cols-1 gap-6 mb-16">
          {filteredJournals.length > 0 ? (
            filteredJournals.map((item, idx) => (
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
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-[#c9f53b] bg-[#c9f53b]/10 px-2.5 py-1 rounded-full uppercase">
                    {item.indexing}
                  </span>
                  {item.quartile && item.quartile !== "NOT_APPLICABLE" && (
                    <span className="text-[10px] font-bold tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full uppercase">
                      {item.quartile}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold tracking-wider text-white/50 bg-white/5 px-2.5 py-1 rounded-full">
                    {item.scope}
                  </span>
                  {item.impactFactor && (
                    <span className="text-[10px] font-semibold tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full">
                      IF: {item.impactFactor.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 hover:text-[#c9f53b] transition-colors leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.title}
                </h3>

                {/* Journal Source & Date */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-white/45 mb-4">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#c9f53b]/80" />
                    <span className="font-semibold text-white/70">{item.journalName}</span>
                  </div>
                  {item.publicationDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.publicationDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
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
                <div className="flex items-center gap-4">
                  {item.paperLink && (
                    <a
                      href={item.paperLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c9f53b] hover:underline"
                    >
                      Read Publication <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {item.doi && (
                    <span className="text-xs font-mono text-white/30">
                      DOI: {item.doi}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/40">No journals found matching the filters.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}

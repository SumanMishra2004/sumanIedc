"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, ExternalLink, Calendar, Users, BookOpen, Bookmark } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Author {
  name: string;
  role: string;
}

interface BookChapterItem {
  id: string;
  title: string;
  bookChapterStatus: string;
  isbnIssn: string | null;
  publisher: string | null;
  publicationDate: string | Date | null;
  doi: string | null;
  paperLink: string | null;
  abstract: string | null;
  keywords: string[];
  authors: Author[];
}

const MOCK_CHAPTERS: BookChapterItem[] = [
  {
    id: "chap-1",
    title: "Security Protocols in Decentralized Internet of Things (IoT) Architectures",
    bookChapterStatus: "PUBLISHED",
    isbnIssn: "978-3-030-12345-6",
    publisher: "Springer, Cham",
    publicationDate: "2024-10-05",
    doi: "10.1007/978-3-030-12345-6_8",
    paperLink: "https://link.springer.com",
    abstract: "This chapter provides a comprehensive review of cybersecurity risks in cloud-to-edge computational loops. We evaluate cryptography protocols suitable for 8-bit microcontrollers...",
    keywords: ["IoT Security", "Edge Cryptography", "Springer Research"],
    authors: [
      { name: "Dr. Suman Mishra", role: "Faculty" },
      { name: "Neha Sen", role: "Student" }
    ]
  },
  {
    id: "chap-2",
    title: "Advances in Intelligent Systems: Sharding Consensus Schemes in Industrial Logistics",
    bookChapterStatus: "PUBLISHED",
    isbnIssn: "978-1-12345-678-9",
    publisher: "CRC Press (Taylor & Francis)",
    publicationDate: "2025-01-20",
    doi: "10.1201/9781123456789-12",
    paperLink: "https://taylorandfrancis.com",
    abstract: "An analysis of transaction throughput rates across different sharding mechanisms inside distributed ledger systems. Suggests a consensus pipeline suited for heavy machinery shipping registers...",
    keywords: ["Consensus Optimization", "Sharding Ledger", "Industrial IoT"],
    authors: [
      { name: "Prof. Rajesh Kumar", role: "Faculty" },
      { name: "Ananya Roy", role: "Student" }
    ]
  }
];

export default function BookChapterClient({ initialChapters }: { initialChapters: BookChapterItem[] }) {
  const [search, setSearch] = useState("");
  const [publisherFilter, setPublisherFilter] = useState("ALL");

  const chapters = useMemo(() => {
    return initialChapters.length > 0 ? initialChapters : MOCK_CHAPTERS;
  }, [initialChapters]);

  const filteredChapters = useMemo(() => {
    return chapters.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.publisher && item.publisher.toLowerCase().includes(search.toLowerCase())) ||
        item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())) ||
        item.authors.some((a) => a.name.toLowerCase().includes(search.toLowerCase()));

      const matchesPublisher = publisherFilter === "ALL" || 
        (item.publisher && item.publisher.toUpperCase().includes(publisherFilter.toUpperCase()));

      return matchesSearch && matchesPublisher;
    });
  }, [chapters, search, publisherFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(201,245,59,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      
      {/* Gradient Blobs */}
      <div className="absolute top-[20%] right-[-8%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />
      <div className="absolute bottom-[15%] left-[-10%] w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-indigo-500/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ RESEARCH KNOWLEDGE ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Book <span className="text-[#c9f53b]">Chapters</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 mb-12 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chapters, book titles, publishers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/10 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Publisher Select */}
            <select
              value={publisherFilter}
              onChange={(e) => setPublisherFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted/10 border border-border/40 rounded-xl text-xs text-foreground focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-background">All Publishers</option>
              <option value="SPRINGER" className="bg-background">Springer</option>
              <option value="CRC" className="bg-background">CRC Press / Taylor &amp; Francis</option>
              <option value="ELSEVIER" className="bg-background">Elsevier</option>
            </select>
          </div>
        </div>

        {/* Chapters List */}
        <div className="grid grid-cols-1 gap-6 mb-16">
          {filteredChapters.length > 0 ? (
            filteredChapters.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                className="bg-card border border-border/40 hover:border-[#c9f53b]/20 transition-colors duration-300 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden"
              >
                {/* Background glow hover effect */}
                <div className="absolute inset-0 bg-[#c9f53b]/[0.01] opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Metadata badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-[#c9f53b] bg-[#c9f53b]/10 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    {item.bookChapterStatus}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 hover:text-[#c9f53b] transition-colors leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.title}
                </h3>

                {/* Book Details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground mb-4">
                  {item.publisher && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#c9f53b]/80" />
                      <span className="font-semibold text-foreground">{item.publisher}</span>
                    </div>
                  )}
                  {item.isbnIssn && (
                    <div>
                      <span className="text-muted-foreground mr-1.5 uppercase font-medium">ISBN/ISSN:</span>
                      <span className="font-mono text-foreground">{item.isbnIssn}</span>
                    </div>
                  )}
                  {item.publicationDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.publicationDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                    </div>
                  )}
                </div>

                {/* Authors */}
                <div className="flex flex-wrap gap-2 items-center mb-5 border-t border-border/40 pt-4">
                  <span className="text-xs text-muted-foreground font-medium mr-1 uppercase tracking-wider">Chapter Authors:</span>
                  {item.authors.map((author, aIdx) => (
                    <span
                      key={aIdx}
                      className="text-xs bg-muted/10 border border-border/40 rounded-md px-2 py-0.5 text-foreground"
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
                  <p className="text-sm text-muted-foreground leading-relaxed font-light mb-6">
                    {item.abstract}
                  </p>
                )}

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {item.keywords.map((word) => (
                    <span key={word} className="text-[10px] text-muted-foreground border border-border/40 px-2 py-0.5 rounded bg-muted/10">
                      #{word}
                    </span>
                  ))}
                </div>

                {/* Links */}
                {(item.paperLink || item.doi) && (
                  <div className="flex items-center gap-4">
                    {item.paperLink && (
                      <a
                        href={item.paperLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c9f53b] hover:underline"
                      >
                        Read Book Chapter <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {item.doi && (
                      <span className="text-xs font-mono text-muted-foreground">
                        DOI: {item.doi}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-border/40 rounded-2xl">
              <p className="text-muted-foreground">No chapters found matching the filters.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}

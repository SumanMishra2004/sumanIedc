"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Trophy, Calendar, User, ExternalLink, Award } from "lucide-react";
import Footer from "@/components/home/Footer";

interface Earner {
  name: string | null;
  email: string | null;
  role: string;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: string | null;
  year: string;
  imageUrl: string | null;
  documentUrl: string | null;
  earner: Earner;
}

const MOCK_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "ach-1",
    title: "1st Prize at National Smart India Hackathon (SIH 2024)",
    description: "Our student developer team won the grand prize of ₹1,00,000 for their decentralized cold-chain logistics tracing system leveraging LoRa and smart ledgers.",
    category: "Blockchain",
    year: "2024",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600",
    documentUrl: "#",
    earner: {
      name: "Abhishek Sen & Team",
      email: null,
      role: "STUDENT"
    }
  },
  {
    id: "ach-2",
    title: "Secured ₹15 Lakhs Seed Grant for IoT Agriculture Node",
    description: "Selected under the state innovation promotion fund to commercialize the wearable nitrate sweating-sensors designed in the CSE Sandbox Lab.",
    category: "Hardware",
    year: "2025",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600",
    documentUrl: "#",
    earner: {
      name: "Dr. Suman Mishra",
      email: "suman.m@iedc.edu.in",
      role: "FACULTY"
    }
  },
  {
    id: "ach-3",
    title: "Outstanding Research Paper Award at IEEE-GlobeCom 2024",
    description: "Awarded for the publication of the decentralized DID access control paper which evaluated edge nodes under massive Sybil simulated attacks.",
    category: "Research",
    year: "2024",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
    documentUrl: "#",
    earner: {
      name: "Ananya Roy",
      email: null,
      role: "STUDENT"
    }
  }
];

export default function AchievementsClient({ initialAchievements }: { initialAchievements: AchievementItem[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const achievements = useMemo(() => {
    return initialAchievements.length > 0 ? initialAchievements : MOCK_ACHIEVEMENTS;
  }, [initialAchievements]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    achievements.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [achievements]);

  const years = useMemo(() => {
    const set = new Set<string>();
    achievements.forEach(item => {
      if (item.year) set.add(item.year);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase())) ||
        (item.earner.name && item.earner.name.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      const matchesYear = yearFilter === "ALL" || item.year === yearFilter;

      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [achievements, search, categoryFilter, yearFilter]);

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
      <div className="absolute top-[10%] left-[-8%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-violet-600/10 to-transparent" />
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ ACCREDITATIONS &amp; WINS ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cell <span className="text-[#c9f53b]">Achievements</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
          <p className="max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed font-light">
            Celebrating the milestones, hackathon victories, grant sponsorships, and award-winning research designs realized by IEDC innovators.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 mb-12 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search achievements, award details, inventors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/10 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted/10 border border-border/40 rounded-xl text-xs text-muted-foreground focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-background">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-background">{cat}</option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted/10 border border-border/40 rounded-xl text-xs text-muted-foreground focus:outline-none focus:border-[#c9f53b]/50 transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <option value="ALL" className="bg-background">All Years</option>
              {years.map(yr => (
                <option key={yr} value={yr} className="bg-background">{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.3) }}
                className="bg-card border border-border/40 hover:border-[#c9f53b]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Category and Year badges */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    {item.category && (
                      <span className="text-[10px] font-bold tracking-widest text-[#c9f53b] bg-[#c9f53b]/10 px-3 py-1 rounded-full uppercase border border-[#c9f53b]/10">
                        {item.category}
                      </span>
                    )}
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.year}
                    </span>
                  </div>

                  <div className="flex gap-4 items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#c9f53b]/10 flex items-center justify-center text-[#c9f53b] shrink-0">
                      <Trophy className="w-5 h-5 animate-pulse" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground uppercase tracking-tight leading-snug group-hover:text-[#c9f53b]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground font-light leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="border-t border-border/40 pt-4 flex flex-wrap items-center justify-between gap-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-[#c9f53b]/80" />
                    <span>Recipient:</span>
                    <span className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {item.earner.name}
                      <span className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded uppercase font-bold ml-2">
                        {item.earner.role}
                      </span>
                    </span>
                  </div>

                  {item.documentUrl && (
                    <a
                      href={item.documentUrl}
                      className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#c9f53b] hover:underline"
                    >
                      Verify Win <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-20 border border-dashed border-border/40 rounded-2xl">
              <p className="text-muted-foreground">No achievements found matching the filters.</p>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
}

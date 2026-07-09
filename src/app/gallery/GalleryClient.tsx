"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ZoomIn, Eye, Image as ImageIcon } from "lucide-react";
import Footer from "@/components/home/Footer";

interface GalleryItem {
  id: string;
  title: string;
  category: "labs" | "hackathons" | "workshops" | "events";
  imageUrl: string;
  description: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g-1",
    title: "IoT & Cybersecurity Sandbox Lab",
    category: "labs",
    imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=800",
    description: "Our core sandbox setup with edge servers, microcontrollers, and logic analyzers where students prototype."
  },
  {
    id: "g-2",
    title: "IEDC Annual Hackathon 2025",
    category: "hackathons",
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
    description: "Students collaborating during the 36-hour blockchain-for-climate code sprint."
  },
  {
    id: "g-3",
    title: "IP Filing and Patent Clinic Workshop",
    category: "workshops",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800",
    description: "Session covering how to search patent registries and draft claim forms."
  },
  {
    id: "g-4",
    title: "Dignitary Visit - Blockchain Panel",
    category: "events",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800",
    description: "Industry panel hosting global tech specialists reviewing student-led ledger architectures."
  },
  {
    id: "g-5",
    title: "Hardware Prototyping Station",
    category: "labs",
    imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&q=80&w=800",
    description: "Advanced stations featuring signal generators, oscilloscopes, and PCB soldering components."
  },
  {
    id: "g-6",
    title: "Ideation Sprints 2024 Winners",
    category: "hackathons",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    description: "Top team presenting their decentralized pesticide-free food traceability system."
  }
];

export default function GalleryClient() {
  const [activeTab, setActiveTab] = useState<"all" | "labs" | "hackathons" | "workshops" | "events">("all");
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter(item => item.category === activeTab);
  }, [activeTab]);

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
      <div className="absolute top-[15%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />
      <div className="absolute bottom-[20%] left-[-8%] w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-pink-500/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ VISUAL RECORD ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            IEDC <span className="text-[#c9f53b]">Gallery</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
          <p className="max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed font-light">
            Glimpses into our advanced research facility, interactive hackathons, collaborative workshops, and guest lectures.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {["all", "labs", "hackathons", "workshops", "events"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                activeTab === tab
                  ? "bg-[#c9f53b] border-[#c9f53b] text-[#0c0c0c]"
                  : "border-border/40 hover:border-[#c9f53b]/40 text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Gallery Bento / Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedImage(item)}
                className="group cursor-pointer bg-card border border-border/40 hover:border-[#c9f53b]/30 rounded-2xl overflow-hidden backdrop-blur-md relative aspect-4/3 flex flex-col justify-end"
              >
                {/* Image background with hover zoom */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0"
                />
                
                {/* Black Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-80 z-10" />

                {/* Corner Hover Eye Icon */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-[#c9f53b] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <Eye className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="relative z-20 p-6">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#c9f53b] bg-[#c9f53b]/10 px-2 py-0.5 rounded border border-[#c9f53b]/20 inline-block mb-3">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground leading-tight uppercase group-hover:text-[#c9f53b] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 font-light">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox / Enlarged View */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black/95 z-500 backdrop-blur-md flex items-center justify-center p-4"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full border border-border/40 hover:border-border/80 bg-card/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-4xl w-full bg-background border border-border/40 rounded-2xl overflow-hidden relative"
              >
                <div className="aspect-16/10 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 bg-card border-t border-border/40">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#c9f53b] bg-[#c9f53b]/10 px-2.5 py-0.5 rounded border border-[#c9f53b]/20 inline-block mb-2">
                    {selectedImage.category}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-2 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {selectedImage.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {selectedImage.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <Footer />
    </div>
  );
}

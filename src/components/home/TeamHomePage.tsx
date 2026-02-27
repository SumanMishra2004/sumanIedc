"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface Faculty {
  id: number;
  name: string;
  title: string;
  department: string;
  bio: string;
  research: string[];
  email: string;
  publications: number;
  citations: number;
  initials: string;
  color: string;
}

const facultyData: Faculty[] = [
  {
    id: 1,
    name: "Dr. Elena Vasquez",
    title: "Principal Investigator",
    department: "Computational Neuroscience",
    bio: "Pioneering research at the intersection of neuroscience and AI, Dr. Vasquez leads groundbreaking work on neural decoding and adaptive brain-machine interfaces with applications in clinical rehabilitation.",
    research: ["Neural Networks", "Brain-Computer Interfaces", "Cognitive Modeling"],
    email: "e.vasquez@lab.edu",
    publications: 87,
    citations: 3420,
    initials: "EV",
    color: "#C8A97E",
  },
  {
    id: 2,
    name: "Prof. Marcus Chen",
    title: "Senior Researcher",
    department: "Machine Learning",
    bio: "Prof. Chen's work focuses on scalable deep learning architectures and reward-driven agents. His generative model research has produced state-of-the-art results on benchmarks across vision and language.",
    research: ["Deep Learning", "Reinforcement Learning", "Generative Models"],
    email: "m.chen@lab.edu",
    publications: 64,
    citations: 2810,
    initials: "MC",
    color: "#7EA8C8",
  },
  {
    id: 3,
    name: "Dr. Anika Patel",
    title: "Associate Professor",
    department: "Robotics & AI",
    bio: "Dr. Patel designs next-generation autonomous systems capable of navigating unstructured environments. Her human-robot interaction research shapes international standards for safe collaborative robotics.",
    research: ["Autonomous Systems", "Computer Vision", "HRI"],
    email: "a.patel@lab.edu",
    publications: 52,
    citations: 1975,
    initials: "AP",
    color: "#A8C87E",
  },
  {
    id: 4,
    name: "Prof. James Okafor",
    title: "Research Lead",
    department: "Bioinformatics",
    bio: "Prof. Okafor leads computational genomics projects that decode complex disease pathways. His protein-folding algorithms have accelerated drug discovery pipelines at several biotech collaborators worldwide.",
    research: ["Genomics", "Protein Folding", "Systems Biology"],
    email: "j.okafor@lab.edu",
    publications: 71,
    citations: 2640,
    initials: "JO",
    color: "#C87EA8",
  },
  {
    id: 5,
    name: "Dr. Sophia Larsson",
    title: "Assistant Professor",
    department: "Quantum Computing",
    bio: "Dr. Larsson develops fault-tolerant quantum algorithms and error-correction protocols. Her work bridges theoretical quantum complexity and near-term hardware, bringing practical quantum advantage closer to reality.",
    research: ["Quantum Algorithms", "Error Correction", "Quantum ML"],
    email: "s.larsson@lab.edu",
    publications: 39,
    citations: 1340,
    initials: "SL",
    color: "#C8B87E",
  },
  {
    id: 6,
    name: "Dr. Ravi Mehta",
    title: "Postdoctoral Fellow",
    department: "Data Science",
    bio: "Dr. Mehta specialises in causal inference frameworks applied to high-dimensional observational data. His NLP work on low-resource languages is enabling AI access for underrepresented communities globally.",
    research: ["Statistical Learning", "Causal Inference", "NLP"],
    email: "r.mehta@lab.edu",
    publications: 28,
    citations: 890,
    initials: "RM",
    color: "#7EC8B8",
  },
  {
    id: 7,
    name: "Prof. Lena Bauer",
    title: "Research Scientist",
    department: "Human-AI Interaction",
    bio: "Prof. Bauer investigates how people perceive, trust, and collaborate with intelligent systems. Her ethics-in-AI framework has been adopted by regulatory bodies across the EU and Southeast Asia.",
    research: ["UX Research", "Explainable AI", "Ethics in AI"],
    email: "l.bauer@lab.edu",
    publications: 45,
    citations: 1620,
    initials: "LB",
    color: "#B87EC8",
  },
  {
    id: 8,
    name: "Dr. Noah Kim",
    title: "Senior Research Fellow",
    department: "Computer Vision",
    bio: "Dr. Kim's research pushes the frontier of 3D scene understanding and medical image analysis. His detection models are deployed in radiology pipelines at partner hospitals across three continents.",
    research: ["Object Detection", "3D Reconstruction", "Medical Imaging"],
    email: "n.kim@lab.edu",
    publications: 58,
    citations: 2200,
    initials: "NK",
    color: "#C8827E",
  },
];

const VISIBLE = 7;

export default function FacultyCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const detailRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);

  const total = facultyData.length;

  const centeredOffset = (index: number) =>
    Math.max(0, Math.min(index - Math.floor(VISIBLE / 2), total - VISIBLE));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: "expo.out" }
    );
    gsap.fromTo(
      cardsRef.current.filter(Boolean),
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "expo.out", delay: 0.3 }
    );
  }, []);

  const goTo = (index: number) => {
    if (isAnimating || index === activeIndex) return;
    setIsAnimating(true);
    const direction = index > activeIndex ? 1 : -1;

    gsap.to(detailRef.current, {
      opacity: 0,
      x: -20 * direction,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        setActiveIndex(index);
        gsap.fromTo(
          detailRef.current,
          { opacity: 0, x: 20 * direction },
          { opacity: 1, x: 0, duration: 0.4, ease: "expo.out", onComplete: () => setIsAnimating(false) }
        );
      },
    });

    gsap.to(bgRef.current, { opacity: 0.06, duration: 0.2, yoyo: true, repeat: 1 });
    gsap.fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out", delay: 0.22 });
  };

  const scrollSidebar = (dir: "up" | "down") => {
    if (dir === "up" && sidebarOffset === 0) return;
    if (dir === "down" && sidebarOffset + VISIBLE >= total) return;

    const newOffset =
      dir === "down"
        ? Math.min(sidebarOffset + 1, total - VISIBLE)
        : Math.max(sidebarOffset - 1, 0);
    const yDir = dir === "down" ? -1 : 1;

    gsap.to(sidebarListRef.current, {
      y: yDir * 20,
      opacity: 0,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        setSidebarOffset(newOffset);
        gsap.fromTo(
          sidebarListRef.current,
          { y: -yDir * 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.26, ease: "expo.out" }
        );
      },
    });
  };

  const handleCardClick = (actualIndex: number) => {
    if (actualIndex === activeIndex) return;
    const sliceIndex = actualIndex - sidebarOffset;
    if (sliceIndex >= 0 && sliceIndex < VISIBLE) {
      gsap.to(cardsRef.current[sliceIndex], {
        scale: 1.02,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }
    goTo(actualIndex);
  };

  const navigate = (dir: "prev" | "next") => {
    const next =
      dir === "next" ? (activeIndex + 1) % total : (activeIndex - 1 + total) % total;
    setSidebarOffset(() => {
      const newOff = centeredOffset(next);
      gsap.fromTo(
        sidebarListRef.current,
        { y: (dir === "next" ? -24 : 24), opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28, ease: "expo.out" }
      );
      return newOff;
    });
    goTo(next);
  };

  useEffect(() => {
    if (isPaused || isAnimating) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % total;
      setSidebarOffset(() => {
        const newOff = centeredOffset(next);
        gsap.fromTo(
          sidebarListRef.current,
          { y: -24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.28, ease: "expo.out" }
        );
        return newOff;
      });
      goTo(next);
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeIndex, isAnimating, isPaused]);

  const faculty = facultyData[activeIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "100vh",
        backgroundColor: "#0c0c0c",
        color: "#fff",
        fontFamily: "'DM Serif Display', Georgia, serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "60px 16px 40px" : "80px 32px 60px",
      }}
    >
      {/* Top fade */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: 80, background: "linear-gradient(to bottom, #0c0c0c, transparent)", zIndex: 2 }}
      />

      {/* Ambient gradient blobs */}
      <div className="absolute pointer-events-none" style={{ top: "5%", left: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,245,59,0.07) 0%, transparent 65%)", filter: "blur(2px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "8%", right: "-6%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)", filter: "blur(2px)" }} />
      <div className="absolute pointer-events-none" style={{ top: "45%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.07) 0%, transparent 65%)", filter: "blur(2px)" }} />

      {/* BG Glow */}
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 65% 40%, ${faculty.color}1a 0%, transparent 70%)`,
          transition: "background 0.7s ease",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 44px)",
        }}
      />

      {/* Inner content wrapper */}
      <div className="relative z-10 w-full" style={{ maxWidth: 1100 }}>
        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-2 flex-wrap gap-2">
          <div>
            <p
              style={{
                color: faculty.color,
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.34em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Research Laboratory
            </p>
            <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.9)" }}>
              Our Faculty
            </h1>
          </div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", position: "relative", overflow: "hidden", marginBottom: isMobile ? 24 : 36 }}>
          <div
            ref={lineRef}
            style={{ position: "absolute", inset: 0, transformOrigin: "left", backgroundColor: faculty.color, opacity: 0.7 }}
          />
        </div>

        {/* ── Main Layout ── */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 24 : 28,
            alignItems: "anchor-center",
          }}
        >
          {/* ── Sidebar ── */}
          {!isMobile && (
            <div style={{ width: 240, flexShrink: 0, position: "relative", display: "flex", flexDirection: "column" }}>
              {/* Top fade */}
              <div
                style={{
                  position: "absolute",
                  top: 32,
                  left: 0,
                  right: 0,
                  height: 28,
                  zIndex: 2,
                  pointerEvents: "none",
                  background: `linear-gradient(to bottom, ${faculty.color}1a, transparent)`,
                }}
              />
              {/* Bottom fade */}
              <div
                style={{
                  position: "absolute",
                  bottom: 32,
                  left: 0,
                  right: 0,
                  height: 28,
                  zIndex: 2,
                  pointerEvents: "none",
                  background: `linear-gradient(to top, ${faculty.color}1a, transparent)`,
                }}
              />

              {/* Up button */}
              <button
                onClick={() => scrollSidebar("up")}
                disabled={sidebarOffset === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  height: 30,
                  borderRadius: 8,
                  marginBottom: 6,
                  cursor: sidebarOffset === 0 ? "default" : "pointer",
                  backgroundColor: sidebarOffset === 0 ? "rgba(255,255,255,0.03)" : `${faculty.color}15`,
                  color: sidebarOffset === 0 ? "rgba(255,255,255,0.15)" : faculty.color,
                  border: `1px solid ${sidebarOffset === 0 ? "rgba(255,255,255,0.06)" : `${faculty.color}35`}`,
                  transition: "all 0.2s",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                {sidebarOffset > 0 && `+${sidebarOffset} above`}
              </button>

              {/* Cards */}
              <div ref={sidebarListRef} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {facultyData.slice(sidebarOffset, sidebarOffset + VISIBLE).map((f, sliceI) => {
                  const i = sidebarOffset + sliceI;
                  const isActive = i === activeIndex;
                  return (
                    <div
                      key={f.id}
                      ref={(el) => { cardsRef.current[sliceI] = el; }}
                      onClick={() => handleCardClick(i)}
                      style={{
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 12,
                        border: `1px solid ${isActive ? f.color + "70" : "rgba(255,255,255,0.07)"}`,
                        backgroundColor: isActive ? `${f.color}10` : "rgba(255,255,255,0.03)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {/* Active left bar */}
                      {isActive && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            backgroundColor: f.color,
                            borderRadius: "0 2px 2px 0",
                          }}
                        />
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                            backgroundColor: isActive ? f.color : "rgba(255,255,255,0.08)",
                            color: isActive ? "#0D0D0F" : "rgba(255,255,255,0.5)",
                            transition: "all 0.25s",
                          }}
                        >
                          {f.initials}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                              fontFamily: "'DM Serif Display', Georgia, serif",
                              transition: "color 0.25s",
                            }}
                          >
                            {f.name}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: isActive ? f.color : "rgba(255,255,255,0.25)",
                              fontFamily: "monospace",
                              letterSpacing: "0.05em",
                              transition: "color 0.25s",
                            }}
                          >
                            {f.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Down button */}
              <button
                onClick={() => scrollSidebar("down")}
                disabled={sidebarOffset + VISIBLE >= total}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  height: 30,
                  borderRadius: 8,
                  marginTop: 6,
                  cursor: sidebarOffset + VISIBLE >= total ? "default" : "pointer",
                  backgroundColor: sidebarOffset + VISIBLE >= total ? "rgba(255,255,255,0.03)" : `${faculty.color}15`,
                  color: sidebarOffset + VISIBLE >= total ? "rgba(255,255,255,0.15)" : faculty.color,
                  border: `1px solid ${sidebarOffset + VISIBLE >= total ? "rgba(255,255,255,0.06)" : `${faculty.color}35`}`,
                  transition: "all 0.2s",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {sidebarOffset + VISIBLE < total && `+${total - sidebarOffset - VISIBLE} below`}
              </button>
            </div>
          )}

          {/* ── Mobile: horizontal scroll strip ── */}
          {isMobile && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {facultyData.map((f, i) => {
                const isActive = i === activeIndex;
                return (
                  <div
                    key={f.id}
                    onClick={() => handleCardClick(i)}
                    style={{
                      flexShrink: 0,
                      cursor: "pointer",
                      borderRadius: 12,
                      border: `1px solid ${isActive ? f.color + "70" : "rgba(255,255,255,0.07)"}`,
                      backgroundColor: isActive ? `${f.color}12` : "rgba(255,255,255,0.03)",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.25s",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: isActive ? f.color : "rgba(255,255,255,0.08)",
                        color: isActive ? "#0D0D0F" : "rgba(255,255,255,0.5)",
                        flexShrink: 0,
                      }}
                    >
                      {f.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
                        {f.name.split(" ").slice(-1)[0]}
                      </p>
                      <p style={{ fontSize: 9, color: isActive ? f.color : "rgba(255,255,255,0.25)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {f.initials}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Detail Panel ── */}
          <div
            ref={detailRef}
            style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              style={{
                borderRadius: 20,
                border: `1px solid ${faculty.color}28`,
                backgroundColor: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(24px)",
                overflow: "hidden",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Accent bar */}
              <div style={{ height: 3, backgroundColor: faculty.color }} />

              <div style={{ padding: isMobile ? "24px 20px" : "36px 40px" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: isMobile ? 16 : 28,
                    marginBottom: isMobile ? 24 : 32,
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 64 : 88,
                      height: isMobile ? 64 : 88,
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 700,
                      flexShrink: 0,
                      backgroundColor: `${faculty.color}1a`,
                      color: faculty.color,
                      border: `1px solid ${faculty.color}30`,
                    }}
                  >
                    {faculty.initials}
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: isMobile ? 26 : 38,
                        fontWeight: 300,
                        color: "rgba(255,255,255,0.92)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                        marginBottom: 6,
                      }}
                    >
                      {faculty.name}
                    </h2>
                    <p
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: faculty.color,
                        fontFamily: "monospace",
                        marginBottom: 4,
                      }}
                    >
                      {faculty.title}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {faculty.department}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: isMobile ? 10 : 14,
                    marginBottom: isMobile ? 22 : 28,
                  }}
                >
                  {[
                    { label: "Publications", value: faculty.publications },
                    { label: "Citations", value: faculty.citations.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        borderRadius: 14,
                        padding: isMobile ? "16px 18px" : "18px 22px",
                        border: `1px solid ${faculty.color}1a`,
                        backgroundColor: `${faculty.color}08`,
                      }}
                    >
                      <p style={{ fontSize: isMobile ? 28 : 34, fontWeight: 300, color: faculty.color, lineHeight: 1, marginBottom: 4 }}>
                        {value}
                      </p>
                      <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.28em", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bio */}
                <div style={{ marginBottom: isMobile ? 20 : 26 }}>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.28em", color: "rgba(255,255,255,0.28)", fontFamily: "monospace", marginBottom: 10 }}>
                    About
                  </p>
                  <p style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 300 }}>
                    {faculty.bio}
                  </p>
                </div>

                {/* Research Areas */}
                <div style={{ marginBottom: isMobile ? 22 : 28 }}>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.28em", color: "rgba(255,255,255,0.28)", fontFamily: "monospace", marginBottom: 12 }}>
                    Research Areas
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {faculty.research.map((area) => (
                      <span
                        key={area}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: isMobile ? 11 : 12,
                          backgroundColor: `${faculty.color}12`,
                          color: faculty.color,
                          fontFamily: "monospace",
                          border: `1px solid ${faculty.color}28`,
                        }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact + Nav */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <a
                    href={`mailto:${faculty.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: isMobile ? 11 : 13,
                      color: faculty.color,
                      fontFamily: "monospace",
                      textDecoration: "none",
                      opacity: 0.85,
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {faculty.email}
                  </a>

                  <div style={{ display: "flex", gap: 8 }}>
                    {(["prev", "next"] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => navigate(dir)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          border: `1px solid ${faculty.color}38`,
                          backgroundColor: `${faculty.color}0e`,
                          color: faculty.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dot indicators ── */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          {facultyData.map((f, i) => (
            <button
              key={f.id}
              onClick={() => goTo(i)}
              style={{
                height: 7,
                width: i === activeIndex ? 22 : 7,
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                backgroundColor: i === activeIndex ? f.color : "rgba(255,255,255,0.18)",
                transition: "all 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
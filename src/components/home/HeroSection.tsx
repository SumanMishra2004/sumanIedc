"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const JOBS = [
  {
    id: 1,
    company: "Spotify",
    salary: "$120K – $200K",
    title: "Senior Product Designer",
    accent: "#1db954",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    tags: ["Design", "Figma", "UX"],
    applicants: 30,
  },
  {
    id: 2,
    company: "Bank VCA",
    salary: "$60K – $112K",
    title: "Senior Teller Executive",
    accent: "#e91e8c",
    image:
      "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&q=80",
    tags: ["Finance", "Banking"],
    applicants: 10,
  },
  {
    id: 3,
    company: "Twitch",
    salary: "$300K – $500K",
    title: "Sr Social Media Specialist",
    accent: "#9146ff",
    image:
      "https://images.unsplash.com/photo-1603481546579-65d935ba9cdd?w=600&q=80",
    tags: ["Social", "Marketing"],
    applicants: 24,
  },
  {
    id: 4,
    company: "Apple",
    salary: "$200K – $500K",
    title: "Frontend Engineer",
    accent: "#ff9500",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    tags: ["React", "Swift", "TS"],
    applicants: 50,
  },
  {
    id: 5,
    company: "Netflix",
    salary: "$300K – $600K",
    title: "Account Executive",
    accent: "#e50914",
    image:
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&q=80",
    tags: ["Sales", "B2B"],
    applicants: 18,
  },
  {
    id: 6,
    company: "Google",
    salary: "$250K – $550K",
    title: "ML Research Scientist",
    accent: "#4285f4",
    image:
      "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=600&q=80",
    tags: ["AI", "Python", "ML"],
    applicants: 42,
  },
  {
    id: 7,
    company: "Airbnb",
    salary: "$180K – $380K",
    title: "Product Manager",
    accent: "#ff5a5f",
    image:
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600&q=80",
    tags: ["Product", "Strategy"],
    applicants: 36,
  },
];

const COUNT = JOBS.length;

// ─── CARD DIMENSIONS ──────────────────────────────────────────────────────────
const CARD_W = 320;
const CARD_H = 400;

// ─── ARC CONFIG ───────────────────────────────────────────────────────────────
const RADIUS = 1100;
const STEP_ANGLE = 15;
const VISIBLE_SIDE = 3;

function slotToXYR(offset: number) {
  const angleDeg = 90 + offset * STEP_ANGLE;
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = RADIUS * Math.cos(angleRad);
  const cy = -RADIUS * Math.sin(angleRad);

  const x = cx;
  const y = cy + RADIUS;

  const rotation = -offset * STEP_ANGLE * 0.9;

  return { x, y, rotation };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function CardCarousel() {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initDone = useRef(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getOffset = (cardIndex: number) => {
    let diff = (cardIndex - ((active % COUNT) + COUNT)) % COUNT;
    if (diff > COUNT / 2) diff -= COUNT;
    if (diff < -COUNT / 2) diff += COUNT;
    return diff;
  };

  const animate = (currentActive: number) => {
    cardRefs.current.forEach((el, cardIndex) => {
      if (!el) return;

      // compute offset relative to currentActive (not stale closure)
      let diff = (cardIndex - ((currentActive % COUNT) + COUNT)) % COUNT;
      if (diff > COUNT / 2) diff -= COUNT;
      if (diff < -COUNT / 2) diff += COUNT;
      const offset = diff;

      const { x, y, rotation } = slotToXYR(offset);
      const dist = Math.abs(offset);
      const isActive = offset === 0;

      const scale = isActive ? 1.08 : Math.max(0.65, 0.88 - dist * 0.06);
      const opacity =
        dist > VISIBLE_SIDE
          ? 0
          : isActive
            ? 1
            : Math.max(0.35, 0.9 - dist * 0.18);
      const zIndex = 20 - dist;

      // 3D: side cards rotate on Y axis to give depth; active faces forward
      const rotateY = offset * -15; // -36° on far left, +36° on far right
      const rotateX = isActive ? -2 : dist * 1.5; // subtle tilt back for side cards

      gsap.to(el, {
        x,
        y,
        rotation,
        rotationY: rotateY,
        rotationX: rotateX,
        scale,
        opacity,
        zIndex,
        duration: 0.65,
        ease: "power3.out",
      });
    });
  };

  // Start / restart autoplay
  const startAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActive((a) => a + 1);
    }, 1500);
  };

  // Mount
  useEffect(() => {
    if (!initDone.current) {
      initDone.current = true;
      animate(0);
    }
    startAutoplay();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active change
  useEffect(() => {
    if (initDone.current) animate(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const activeJobIndex = ((active % COUNT) + COUNT) % COUNT;
  const activeJob = JOBS[activeJobIndex];

  const edgeY =
    RADIUS - RADIUS * Math.cos((VISIBLE_SIDE * STEP_ANGLE * Math.PI) / 180);
  const STAGE_H = Math.ceil(edgeY) + CARD_H / 3 - 90;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        overflowX: "clip",
        overflowY: "visible",
        userSelect: "none",
        background: "#0c0c0c",
        fontFamily: "'DM Sans', sans-serif",
        width: "100%",
        perspective: 1400,
        perspectiveOrigin: "50% 100%",
      }}
      className="md:mb-36 pt-22"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes blobA { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.06)} }
        @keyframes blobB { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(0.95)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      {/* ── Ambient lime blobs ── */}
      <div
        style={{
          position: "absolute",
          top: "-5%",
          left: "-8%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(201,245,59,0.07) 0%,transparent 65%)",
          pointerEvents: "none",
          animation: "blobA 10s ease-in-out infinite",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(168,214,42,0.06) 0%,transparent 65%)",
          pointerEvents: "none",
          animation: "blobB 13s ease-in-out infinite",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "35%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(201,245,59,0.05) 0%,transparent 65%)",
          pointerEvents: "none",
          animation: "blobA 16s ease-in-out infinite",
          zIndex: 0,
        }}
      />

      {/* ── CAROUSEL STAGE — absolutely behind everything ── */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          height: STAGE_H + 140,
          zIndex: 3,
          transformStyle: "preserve-3d",
          pointerEvents: "none",
        }} className="hidden md:block"
      >
        {JOBS.map((job, cardIndex) => (
          <div
            key={job.id}
            ref={(el) => {
              cardRefs.current[cardIndex] = el;
            }}
            onClick={() => {
              const offset = getOffset(cardIndex);
              setActive((a) => a + offset);
              startAutoplay();
            }}
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              width: CARD_W,
              height: CARD_H,
              marginLeft: -CARD_W / 2,
              cursor: "pointer",
              transformOrigin: "bottom center",
              willChange: "transform,opacity",
              transformStyle: "preserve-3d",
              pointerEvents: "auto",
            }}
          >
            {/* Inner card */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 24,
                overflow: "hidden",
                position: "relative",
                boxShadow:
                  cardIndex === activeJobIndex
                    ? `0 28px 72px rgba(0,0,0,0.75), 0 0 0 2.5px ${job.accent}`
                    : "0 10px 40px rgba(0,0,0,0.55)",
                transition: "box-shadow 0.4s",
              }}
            >
              <Image
                src={job.image}
                alt={job.title}
                fill
                style={{
                  objectFit: "cover",
                  filter:
                    cardIndex === activeJobIndex
                      ? "brightness(0.75) saturate(1.15)"
                      : "brightness(0.38) saturate(0.65)",
                  transition: "filter 0.5s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05) 100%)",
                }}
              />
              {cardIndex === activeJobIndex && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 110%, ${job.accent}30, transparent 65%)`,
                    pointerEvents: "none",
                  }}
                />
              )}
              {cardIndex === activeJobIndex && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 24,
                    border: `2px solid ${job.accent}`,
                    pointerEvents: "none",
                    boxShadow: `inset 0 0 20px ${job.accent}18`,
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "20px 18px 18px",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    alignSelf: "flex-start",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: `${job.accent}25`,
                    color: job.accent,
                    border: `1px solid ${job.accent}50`,
                    backdropFilter: "blur(6px)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {job.company}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    color: "#fff",
                    lineHeight: 1.25,
                  }}
                >
                  {job.title}
                </div>
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: job.accent }}
                >
                  {job.salary}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {job.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "3px 9px",
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.11)",
                        color: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {cardIndex === activeJobIndex && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}
                    >
                      👥 {job.applicants}+ applied
                    </span>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 16px",
                        borderRadius: 99,
                        background: `linear-gradient(135deg,${job.accent},${job.accent}cc)`,
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: `0 4px 18px ${job.accent}55`,
                      }}
                    >
                      Apply Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Scrim: dark where text lives → opens up over cards → solid at section seam ─────
           bottom is -9rem (144px) so it covers the overflow zone that mb-36 exposes,*/}
    <div
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: "-14rem",
    zIndex: 4,
    pointerEvents: "none",
    background: `
      linear-gradient(
        to bottom,
        rgba(12,12,12,0) 0%,
        rgba(12,12,12,0.1) 20%,
        rgba(12,12,12,0.25) 40%,
        rgba(12,12,12,0.5) 60%,
        rgba(12,12,12,0.75) 80%,
        #0c0c0c 100%
      )
    `,
  }}
/>
      {/* ── MAIN CONTENT — sits above scrim ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          width: "100%",
          minHeight: "100vh",
          padding: "48px 0 0 0",
          alignItems: "stretch",
        }}
      >
        {/* ── LEFT / CENTER — Institution name block ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 6vw",
            minWidth: 0,
          }}
        >
          {/* Top label row */}

          {/* ── PRIMARY GIANT HEADING ── */}
          {/* Cell name */}
          <h1
            style={{
              fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
              fontSize: "clamp(3.2rem, 7.5vw, 7rem)",
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: "0.01em",
              color: "#fff",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Innovation &amp;
            <br />
            Entrepreneurship
            <br />
            <span
              style={{
                color: "#c9f53b",
              }}
            >
              Development Cell
            </span>
          </h1>

          {/* Acronym badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 12,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(1.1rem, 2.5vw, 1.8rem)",
                fontWeight: 700,
                color: "#0c0c0c",
                background: "#c9f53b",
                padding: "4px 20px",
                letterSpacing: "0.25em",
                borderRadius: 4,
              }}
            >
              I.E.D.C
            </span>
            <div
              style={{
                height: 2,
                flex: 1,
                maxWidth: 120,
                background: "linear-gradient(to right, #c9f53b, transparent)",
              }}
            />
          </div>

          {/* Horizontal rule */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(to right, rgba(201,245,59,0.4), transparent)",
              marginBottom: 20,
              width: "70%",
            }}
          />

          {/* ── DEPARTMENT NAME ── */}
          <h2
            style={{
              fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
              fontSize: "clamp(1.5rem, 3.4vw, 3.2rem)",
              fontWeight: 400,
              lineHeight: 1.0,
              letterSpacing: "0.015em",
              color: "rgba(255,255,255,0.78)",
              margin: 0,
              marginBottom: 10,
            }}
          >
            Department of Computer Science and Engineering
          </h2>

          {/* Specialisations */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap" as const,
              gap: 8,
              marginBottom: 36,
            }}
          >
            {[
              "Internet of Things",
              "Cyber Security",
              "Blockchain Technology",
            ].map((s) => (
              <span
                key={s}
                style={{
                  fontFamily: "monospace",
                  fontSize: "clamp(0.6rem, 1vw, 0.78rem)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  color: "#c9f53b",
                  border: "1px solid rgba(201,245,59,0.35)",
                  background: "rgba(201,245,59,0.06)",
                  padding: "5px 14px",
                  borderRadius: 4,
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <button
              style={{
                padding: "13px 34px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#0c0c0c",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#c9f53b,#a8d62a)",
                boxShadow: "0 4px 28px rgba(201,245,59,0.35)",
                textTransform: "uppercase" as const,
              }}
            >
              Explore Programs →
            </button>
            <button
              style={{
                padding: "13px 34px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#c9f53b",
                border: "1px solid rgba(201,245,59,0.4)",
                cursor: "pointer",
                background: "transparent",
                textTransform: "uppercase" as const,
              }}
            >
              Meet the Team
            </button>
          </div>
        </div>

        {/* ── RIGHT — Vertical tagline strip ── */}
        <div
          style={{
            width: 56,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: "1px solid rgba(201,245,59,0.12)",
            padding: "40px 0",
            gap: 32,
            position: "relative",
          }}
        >
          {/* Vertical scrolling indicator line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 1,
              height: "100%",
              background:
                "linear-gradient(to bottom, transparent, rgba(201,245,59,0.2) 30%, rgba(201,245,59,0.2) 70%, transparent)",
              pointerEvents: "none",
            }}
          />

          {/* Vertical text — tagline */}
          <div
            style={{
              writingMode: "vertical-rl" as const,
              textOrientation: "mixed" as const,
              transform: "rotate(180deg)",
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase" as const,
              color: "rgba(201,245,59,0.7)",
              userSelect: "none",
            }}
          >
            Innovate · Build · Disrupt
          </div>

          {/* Divider dot */}
          

       
        </div>
      </div>
    </div>
  );
}

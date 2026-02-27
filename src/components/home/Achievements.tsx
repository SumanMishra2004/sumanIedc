"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const stats = [
  {
    value: "500",
    suffix: "+",
    label: "Research Papers",
    sub: "Top-tier journals & conferences",
  },
  {
    value: "50",
    suffix: "+",
    label: "Patents Filed",
    sub: "IP protected innovations",
  },
  {
    value: "10",
    suffix: "M+",
    prefix: "$",
    label: "Research Grants",
    sub: "Govt & private funding",
  },
  {
    value: "100",
    suffix: "+",
    label: "Global Partners",
    sub: "Universities & tech giants",
  },
  {
    value: "25",
    suffix: "+",
    label: "Years Active",
    sub: "Pioneering since 1999",
  },
  {
    value: "300",
    suffix: "+",
    label: "PhD Graduates",
    sub: "Alumni shaping the world",
  },
];

const BASE_SLIDES = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1532094349884-543559244e1f?w=900&q=80",
    tag: "Quantum Lab",
    title: "Frontier Computing",
    year: "2024",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
    tag: "Electronics",
    title: "Nano Circuits",
    year: "2023",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=900&q=80",
    tag: "Photonics",
    title: "Light-Speed Data",
    year: "2023",
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=900&q=80",
    tag: "BioTech",
    title: "Living Systems",
    year: "2022",
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80",
    tag: "AI & Vision",
    title: "Neural Horizons",
    year: "2022",
  },
  {
    id: 6,
    img: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=900&q=80",
    tag: "Space Tech",
    title: "Orbital Systems",
    year: "2021",
  },
];

const N = BASE_SLIDES.length;
const SLIDES = [...BASE_SLIDES, ...BASE_SLIDES, ...BASE_SLIDES]; // triple for infinite

/* coverflow config — mirrors Swiper's */
const SLIDE_W = 340;
const SLIDE_H = 460;
const GAP = 20;
const STRIDE = SLIDE_W + GAP;
const DEPTH = 180; // z-translate for side cards
const ROTATE_Y = 28; // deg rotation for side cards
const MODIFIER = 2.2; // multiplier per step distance
const SCALE_OFF = 0.82; // scale of off-center cards

/* ─────────────────────────────────────────────
   Counter
───────────────────────────────────────────── */
function Counter({
  target,
  duration = 2,
}: {
  target: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    ScrollTrigger.create({
      trigger: ref.current,
      start: "top 85%",
      onEnter: () => {
        if (started.current) return;
        started.current = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            if (ref.current)
              ref.current.textContent = Math.round(obj.val).toString();
          },
        });
      },
    });
  }, [target, duration]);
  return <span ref={ref}>0</span>;
}

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function ResearchGlory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statsRowRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // activeReal: 0..N-1 (real slide index)
  const [activeReal, setActiveReal] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // virtualIdx: position in the SLIDES triple array, starts at N (middle copy)
  const virtualIdx = useRef(N);
  const isAnimating = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);

  /* ── apply coverflow transforms to all cards ─────────────────────── */
  const applyCovertflow = useCallback((vi: number, animated = true) => {
    const dur = animated ? 0.55 : 0;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const offset = i - vi; // how far from center
      const absOff = Math.abs(offset);

      const rotY =
        -offset * ROTATE_Y * (1 / (absOff * MODIFIER + 1)) * MODIFIER;
      const transZ = -absOff * DEPTH * (1 / (absOff * MODIFIER + 1)) * MODIFIER;
      const scl = offset === 0 ? 1 : SCALE_OFF - absOff * 0.04;
      const opc = absOff > 3 ? 0 : offset === 0 ? 1 : 0.6 - absOff * 0.08;
      const blur = offset === 0 ? 0 : absOff * 1.5;

      // x: center each card, then translate by offset
      const vpW = viewportRef.current?.offsetWidth ?? 900;
      const centerX = (vpW - SLIDE_W) / 2;
      const x = centerX + offset * STRIDE;

      gsap.to(el, {
        x,
        rotateY: rotY,
        z: transZ,
        scale: Math.max(0.65, scl),
        opacity: Math.max(0, opc),
        filter: `blur(${blur}px) grayscale(${offset === 0 ? 0 : 40}%)`,
        duration: dur,
        ease: "power3.out",
        overwrite: true,
      });
    });
  }, []);

  /* ── init positions ────────────────────────────────────────────────── */
  useEffect(() => {
    // small delay so refs populate
    const raf = requestAnimationFrame(() => applyCovertflow(N, false));
    return () => cancelAnimationFrame(raf);
  }, [applyCovertflow]);

  // resize
  useEffect(() => {
    const onResize = () => applyCovertflow(virtualIdx.current, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyCovertflow]);

  /* ── navigate ──────────────────────────────────────────────────────── */
  const navigate = useCallback(
    (delta: number) => {
      if (isAnimating.current) return;
      const nextVi = virtualIdx.current + delta;
      const nextReal = ((nextVi % N) + N) % N;

      isAnimating.current = true;
      virtualIdx.current = nextVi;
      setActiveReal(nextReal);
      applyCovertflow(nextVi, true);

      // after animation, jump to middle copy if we've drifted
      gsap.delayedCall(0.6, () => {
        isAnimating.current = false;
        if (nextVi < N || nextVi >= N * 2) {
          const corrected = N + nextReal;
          virtualIdx.current = corrected;
          applyCovertflow(corrected, false);
        }
      });
    },
    [applyCovertflow],
  );

  /* ── auto-rotate ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => navigate(1), 3000);
    return () => clearInterval(t);
  }, [isPaused, navigate]);

  /* ── drag ──────────────────────────────────────────────────────────── */
  const onPointerDown = (e: React.PointerEvent) => {
    setIsPaused(true);
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragDelta.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragDelta.current = e.clientX - dragStartX.current;
    // live interpolate coverflow
    const progress = -dragDelta.current / STRIDE;
    const liveVi = virtualIdx.current + progress;
    applyCovertflow(liveVi, false);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsPaused(false);
    const threshold = SLIDE_W / 5;
    if (dragDelta.current < -threshold) navigate(1);
    else if (dragDelta.current > threshold) navigate(-1);
    else applyCovertflow(virtualIdx.current, true);
    dragDelta.current = 0;
  };

  /* ── entry animations ──────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll(".word"),
          { y: "110%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            stagger: 0.08,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: headingRef.current, start: "top 80%" },
          },
        );
      }
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.4,
            ease: "expo.inOut",
            scrollTrigger: { trigger: lineRef.current, start: "top 85%" },
          },
        );
      }
      if (statsRowRef.current) {
        gsap.fromTo(
          statsRowRef.current.querySelectorAll(".stat-card"),
          { opacity: 0, y: 60, rotateX: -15 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: statsRowRef.current, start: "top 75%" },
          },
        );
      }
      if (carouselRef.current) {
        gsap.fromTo(
          carouselRef.current,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: carouselRef.current, start: "top 80%" },
          },
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ─── RENDER ─────────────────────────────────────────────────────── */
  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        fontFamily: "'Syne', sans-serif",
        color: "#f0ede6",
        background: "#080808",
      }}
    >
      {/* grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "50vh",
          background:
            "radial-gradient(ellipse, rgba(201,245,59,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Ambient color blobs */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-6%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(219,39,119,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          left: "15%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,245,59,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(2px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── HEADER ── */}
        <div
          style={{ padding: "clamp(48px,8vw,96px) 6vw clamp(24px,4vw,48px)" }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#c9f53b",
              marginBottom: "24px",
            }}
          >
            — Research & Glory
          </p>
          <h2
            ref={headingRef}
            style={{
              fontSize: "clamp(3rem, 7vw, 6.5rem)",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              margin: 0,
              overflow: "hidden",
            }}
          >
            {["Decades", "of", "Relentless"].map((w, i) => (
              <span
                key={i}
                className="word"
                style={{
                  display: "inline-block",
                  marginRight: "0.35em",
                  opacity: 0,
                  willChange: "transform",
                }}
              >
                {i === 2 ? (
                  <em style={{ fontStyle: "italic", color: "#c9f53b" }}>{w}</em>
                ) : (
                  w
                )}
              </span>
            ))}
            <br />
            <span
              className="word"
              style={{
                display: "inline-block",
                opacity: 0,
                willChange: "transform",
              }}
            >
              Innovation
            </span>
          </h2>
          <div
            ref={lineRef}
            style={{
              height: "1px",
              background: "linear-gradient(90deg, #c9f53b, transparent)",
              marginTop: "48px",
              transformOrigin: "left",
            }}
          />
        </div>

        {/* ── STATS ── */}
        <div
          ref={statsRowRef}
          className="stats-grid"
          style={{
            gap: "1px",
            background: "rgba(255,255,255,0.05)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            perspective: "1000px",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{
                background: "#080808",
                padding: "clamp(20px,4vw,48px) clamp(16px,3vw,32px)",
                position: "relative",
                cursor: "default",
                overflow: "hidden",
                opacity: 0,
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#0f0f0f";
                gsap.to(e.currentTarget.querySelector(".sa"), {
                  scaleY: 1,
                  duration: 0.4,
                  ease: "power2.out",
                });
                gsap.to(e.currentTarget.querySelector(".sn"), {
                  color: "#c9f53b",
                  duration: 0.3,
                });
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#080808";
                gsap.to(e.currentTarget.querySelector(".sa"), {
                  scaleY: 0,
                  duration: 0.4,
                  ease: "power2.in",
                });
                gsap.to(e.currentTarget.querySelector(".sn"), {
                  color: "#f0ede6",
                  duration: 0.3,
                });
              }}
            >
              <div
                className="sa"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "3px",
                  height: "100%",
                  background: "#c9f53b",
                  transform: "scaleY(0)",
                  transformOrigin: "bottom",
                }}
              />
              <div
                className="sn"
                style={{
                  fontSize: "clamp(2.2rem, 3.5vw, 3.8rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  marginBottom: "12px",
                  transition: "color 0.3s",
                }}
              >
                {s.prefix || ""}
                <Counter target={parseInt(s.value)} duration={2} />
                {s.suffix}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(240,237,230,0.35)",
                  lineHeight: 1.5,
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── COVERFLOW CAROUSEL ── */}
        <div
          ref={carouselRef}
          style={{ padding: "clamp(48px,8vw,96px) 0 80px" }}
        >
          {/* header */}
          <div
            className="carousel-header"
            style={{ padding: "0 6vw", marginBottom: "56px" }}
          >
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "#c9f53b",
                  marginBottom: "12px",
                }}
              >
                — Visual Archive
              </p>
              <h3
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                Labs & Breakthroughs
              </h3>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {(["←", "→"] as const).map((arrow, dir) => (
                <button
                  key={dir}
                  onClick={() => navigate(dir === 0 ? -1 : 1)}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "transparent",
                    color: "#f0ede6",
                    fontSize: "18px",
                    cursor: "pointer",
                    transition: "all 0.25s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "#c9f53b";
                    el.style.color = "#080808";
                    el.style.borderColor = "#c9f53b";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "transparent";
                    el.style.color = "#f0ede6";
                    el.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>

          {/* coverflow viewport */}
          <div
            ref={viewportRef}
            style={{
              position: "relative",
              height: `${SLIDE_H + 40}px`,
              overflow: "hidden",
              cursor: "grab",
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* edge fade masks */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                pointerEvents: "none",
                background:
                  "linear-gradient(90deg, #080808 0%, transparent 20%, transparent 80%, #080808 100%)",
              }}
            />

            {SLIDES.map((slide, i) => {
              const realIndex = i % N;
              return (
                <div
                  key={`${slide.id}-${i}`}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  onClick={() => {
                    const delta = i - virtualIdx.current;
                    if (delta !== 0) navigate(Math.sign(delta));
                  }}
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: 0,
                    width: `${SLIDE_W}px`,
                    height: `${SLIDE_H}px`,
                    borderRadius: "18px",
                    overflow: "hidden",
                    cursor: realIndex === activeReal ? "default" : "pointer",
                    willChange: "transform, filter, opacity",
                    transformStyle: "preserve-3d",
                    opacity: 0,
                  }}
                >
                  {/* image */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "-4px",
                      backgroundImage: `url(${slide.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  {/* overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(170deg, rgba(0,0,0,0.0) 30%, rgba(8,8,8,0.9) 100%)",
                    }}
                  />

                  {/* year badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px",
                      padding: "4px 10px",
                      color: "#f0ede6",
                    }}
                  >
                    {slide.year}
                  </div>

                  {/* text */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "24px",
                      left: "24px",
                      right: "24px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        color: "#c9f53b",
                        marginBottom: "8px",
                      }}
                    >
                      {slide.tag}
                    </p>
                    <h4
                      style={{
                        fontSize: "1.55rem",
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        margin: 0,
                        lineHeight: 1.1,
                        color: "#f0ede6",
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {slide.title}
                    </h4>
                  </div>

                  {/* active bottom line */}
                  {realIndex === activeReal && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: "#c9f53b",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* dots + counter */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "32px 6vw 0",
              alignItems: "center",
            }}
          >
            {BASE_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i - activeReal)}
                style={{
                  width: i === activeReal ? "32px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background:
                    i === activeReal ? "#c9f53b" : "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition:
                    "width 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.3s",
                }}
              />
            ))}
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "rgba(240,237,230,0.35)",
              }}
            >
              {String(activeReal + 1).padStart(2, "0")} /{" "}
              {String(N).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
      {/* ← FIXED: closing tag for <div style={{ position: "relative", zIndex: 1 }}> */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(6, 1fr); }
        }
        .carousel-header {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: flex-end;
          justify-content: space-between;
        }
      `}</style>
    </section>
  );
}

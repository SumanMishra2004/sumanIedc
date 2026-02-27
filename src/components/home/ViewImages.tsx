"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LabSlide {
  id: number;
  label: string;
  category: string;
  description: string;
  year: string;
  color: string;
  imageUrl: string;
}

// ─── Data — all accents match the site palette ───────────────────────────────
const LAB_SLIDES: LabSlide[] = [
  {
    id: 1,
    label: "Electron Microscopy",
    category: "Imaging · Level 4",
    description:
      "High-resolution transmission electron microscopy revealing nanoscale crystalline structures at 2Å resolution.",
    year: "2024",
    color: "#c9f53b",
    imageUrl:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=90",
  },
  {
    id: 2,
    label: "Protein Crystallography",
    category: "Structural Biology · Lab B",
    description:
      "X-ray diffraction patterns from engineered insulin analogs showing conformational shifts under physiological pH.",
    year: "2024",
    color: "#a8d62a",
    imageUrl:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1600&q=90",
  },
  {
    id: 3,
    label: "Microfluidics Array",
    category: "Lab-on-Chip · Series 7",
    description:
      "Droplet generation at 8,000 Hz enabling single-cell encapsulation for high-throughput genomic screening.",
    year: "2023",
    color: "#c9f53b",
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1600&q=90",
  },
  {
    id: 4,
    label: "Neural Interface",
    category: "Neurotech · Prototype III",
    description:
      "256-channel cortical recording array achieving simultaneous readout from prefrontal and hippocampal regions.",
    year: "2024",
    color: "#a8d62a",
    imageUrl:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1600&q=90",
  },
  {
    id: 5,
    label: "Quantum Sensing",
    category: "Quantum Lab · Cryogenic",
    description:
      "NV-center diamond magnetometer operating at 15mK detecting sub-femtotesla magnetic anomalies.",
    year: "2024",
    color: "#c9f53b",
    imageUrl:
      "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1600&q=90",
  },
];
//───────────────────────────────────────────────────
export default function LabCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragging, setDragging] = useState(false);

  const total = LAB_SLIDES.length;
  const dragStart = useRef(0);
  const dragX = useRef(0);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Transition to slide ──────────────────────────────────────────────────
  const goTo = useCallback(
    (next: number, dir: 1 | -1 = 1) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const tl = gsap.timeline({
        onComplete: () => {
          setCurrent(next);
          setIsAnimating(false);
        },
      });

      const currentSlide = slidesRef.current[current];
      const nextSlide = slidesRef.current[next];
      const slideW = containerRef.current?.offsetWidth ?? window.innerWidth;

      // Position next slide off-screen
      gsap.set(nextSlide, { x: dir * slideW, opacity: 1, zIndex: 2 });
      gsap.set(currentSlide, { zIndex: 1 });

      // Overlay flash
      tl.to(overlayRef.current, {
        opacity: 0.35,
        duration: 0.18,
        ease: "power2.in",
      });

      // Slide transition
      tl.to(
        currentSlide,
        {
          x: -dir * slideW * 0.3,
          opacity: 0,
          duration: 0.72,
          ease: "expo.inOut",
        },
        "<",
      );
      tl.to(
        nextSlide,
        { x: 0, opacity: 1, duration: 0.72, ease: "expo.inOut" },
        "<",
      );

      // Overlay out
      tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.25");

      // HUD text swap
      tl.to(
        [titleRef.current, descRef.current, metaRef.current],
        {
          y: dir * 20,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          stagger: 0.04,
        },
        0.1,
      );
      tl.set([titleRef.current, descRef.current, metaRef.current], {
        y: -dir * 20,
        onComplete: () => {
          // Text updates happen via react state (current index), but we drive manually
        },
      });
      tl.to(
        [titleRef.current, descRef.current, metaRef.current],
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: "power3.out",
          stagger: 0.06,
          onStart: () => setCurrent(next),
        },
        "-=0.3",
      );

      // Progress bar
      tl.to(
        progressBarRef.current,
        { scaleX: (next + 1) / total, duration: 0.72, ease: "expo.inOut" },
        0,
      );

      // Counter count-up effect
      if (counterRef.current) {
        const obj = { val: current + 1 };
        tl.to(
          obj,
          {
            val: next + 1,
            duration: 0.5,
            onUpdate: () => {
              if (counterRef.current)
                counterRef.current.textContent = String(
                  Math.round(obj.val),
                ).padStart(2, "0");
            },
          },
          0,
        );
      }
    },
    [current, isAnimating, total],
  );

  const next = useCallback(
    () => goTo((current + 1) % total, 1),
    [current, goTo, total],
  );
  const prev = useCallback(
    () => goTo((current - 1 + total) % total, -1),
    [current, goTo, total],
  );

  // ── Autoplay ─────────────────────────────────────────────────────────────
  const resetAutoplay = useCallback(() => {
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    autoplayTimer.current = setTimeout(next, 5000);
  }, [next]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    };
  }, [current, resetAutoplay]);

  // ── Intro animation ───────────────────────────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });
    tl.from(containerRef.current, { opacity: 0, duration: 0.6 });
    tl.from(
      [titleRef.current, metaRef.current, descRef.current],
      { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" },
      0.3,
    );
    gsap.set(progressBarRef.current, { scaleX: 1 / total });
  }, [total]);

  // ── Drag / swipe ──────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (isAnimating) return;
    setDragging(true);
    dragStart.current = e.clientX;
    dragX.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    dragX.current = e.clientX - dragStart.current;
    gsap.set(slidesRef.current[current], { x: dragX.current * 0.25 });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    gsap.to(slidesRef.current[current], {
      x: 0,
      duration: 0.4,
      ease: "elastic.out(1,0.6)",
    });
    if (dragX.current < -60) next();
    else if (dragX.current > 60) prev();
  };

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const slide = LAB_SLIDES[current];

  return (
    <section className="relative w-full">
      {/* ── Blend seam from section above ─────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: 80,
          background:
            "linear-gradient(to bottom, #0c0c0c 0%, transparent 100%)",
        }}
      />
      {/* Ambient gradient blobs */}
      <div className="absolute pointer-events-none" style={{ top: "10%", left: "-6%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,245,59,0.08) 0%, transparent 65%)", filter: "blur(2px)", zIndex: 0 }} />
      <div className="absolute pointer-events-none" style={{ top: "30%", right: "-5%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)", filter: "blur(2px)", zIndex: 0 }} />
      <div className="absolute pointer-events-none" style={{ bottom: "10%", left: "30%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.07) 0%, transparent 65%)", filter: "blur(2px)", zIndex: 0 }} />

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-20  flex items-center gap-4">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span
          className="text-[20px] font-bold tracking-[0.4em] uppercase py-10"
          style={{ color: "#c9f53b" }}
        >
          ◆ Research Gallery ◆
        </span>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      {/* ── Carousel ──────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none"
        style={{ height: "90vh", minHeight: 520, maxHeight: 900 }}
      >
        {/* Slides track */}
        <div
          className="absolute inset-0"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
        >
          {LAB_SLIDES.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => {
                if (el) slidesRef.current[i] = el;
              }}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translateX(${i === 0 ? "0" : "100%"})`,
                opacity: i === 0 ? 1 : 0,
                zIndex: i === 0 ? 1 : 0,
              }}
            >
              <img
                src={s.imageUrl}
                alt={s.label}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              {/* Left-heavy vignette so text stays readable */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, rgba(12,12,12,0.95) 0%, rgba(12,12,12,0.6) 55%, rgba(12,12,12,0.15) 100%)",
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,1) 2px,rgba(0,0,0,1) 4px)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Flash overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none z-20"
          style={{ opacity: 0, background: "#c9f53b" }}
        />

        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: slide.color }}
            />
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-mono">
              IEDC Research Laboratory
            </span>
          </div>
          <span
            className="text-[10px] tracking-widest border px-3 py-1 font-mono"
            style={{ color: slide.color, borderColor: slide.color + "44" }}
          >
            {slide.year}
          </span>
        </div>

        {/* Corner hairlines */}
        <div className="absolute top-0 left-0 w-16 h-16 z-30 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-px bg-white/20" />
          <div className="absolute top-4 left-4 h-8 w-px bg-white/20" />
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 z-30 pointer-events-none">
          <div className="absolute top-4 right-4 w-8 h-px bg-white/20" />
          <div className="absolute top-4 right-4 h-8 w-px bg-white/20" />
        </div>

        {/* Main content */}
        <div className="absolute inset-0 z-30 flex flex-col justify-end pointer-events-none px-10 md:px-20 lg:px-24 pb-20">
          <div ref={metaRef} className="mb-4 flex items-center gap-4">
            <div
              className="h-px w-12 flex-shrink-0"
              style={{ backgroundColor: slide.color }}
            />
            <span
              className="text-[10px] tracking-[0.3em] uppercase font-semibold font-mono"
              style={{ color: slide.color }}
            >
              {slide.category}
            </span>
          </div>

          <h2
            ref={titleRef}
            className="text-5xl md:text-7xl xl:text-8xl font-bold text-white leading-none mb-5"
            style={{
              fontFamily: "'Bebas Neue','Arial Narrow',sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            {slide.label}
          </h2>

          <p
            ref={descRef}
            className="max-w-lg text-sm md:text-base text-white/55 leading-relaxed mb-6"
          >
            {slide.description}
          </p>

          {/* Counter + nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1 font-mono">
              <span
                ref={counterRef}
                className="text-2xl font-bold tabular-nums"
                style={{ color: slide.color }}
              >
                {String(current + 1).padStart(2, "0")}
              </span>
              <span className="text-white/25 text-sm mx-1">/</span>
              <span className="text-white/30 text-sm tabular-nums">
                {String(total).padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={prev}
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/50 hover:border-[#c9f53b]/60 hover:text-[#c9f53b] transition-all duration-300 rounded-sm"
                aria-label="Previous"
              >
                ←
              </button>
              <button
                onClick={next}
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/50 hover:border-[#c9f53b]/60 hover:text-[#c9f53b] transition-all duration-300 rounded-sm"
                aria-label="Next"
              >
                →
              </button>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {LAB_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > current ? 1 : -1)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="transition-all duration-300"
                  style={{
                    width: i === current ? 24 : 6,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor:
                      i === current ? "#c9f53b" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="relative h-px bg-white/[0.08]">
            <div
              ref={progressBarRef}
              className="absolute top-0 left-0 h-full origin-left"
              style={{
                backgroundColor: slide.color,
                width: "100%",
                transform: "scaleX(0.2)",
              }}
            />
          </div>
        </div>
      </div>
      {/* end carousel */}

      {/* Bottom bleed */}
      <div
        className="pointer-events-none"
        style={{
          height: 60,
          background:
            "linear-gradient(to bottom, transparent 0%, #0c0c0c 100%)",
        }}
      />

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
    </section>
  );
}

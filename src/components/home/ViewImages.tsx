"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import type { GallerySlideData } from "../../../sanity/lib/queries";
import { urlFor } from "../../../sanity/lib/image";

// ─── Fallback slides (used when Sanity has no data yet) ───────────────────────
const FALLBACK_SLIDES: GallerySlideData[] = [
  {
    _id: "s1",
    label: "Electron Microscopy",
    category: "Imaging · Level 4",
    description:
      "High-resolution transmission electron microscopy revealing nanoscale crystalline structures at 2Å resolution.",
    year: "2024",
    accentColor: "#c9f53b",
    image: null as never,
    orderRank: 1,
  },
  {
    _id: "s2",
    label: "Protein Crystallography",
    category: "Structural Biology · Lab B",
    description:
      "X-ray diffraction patterns from engineered insulin analogs showing conformational shifts under physiological pH.",
    year: "2024",
    accentColor: "#a8d62a",
    image: null as never,
    orderRank: 2,
  },
  {
    _id: "s3",
    label: "Microfluidics Array",
    category: "Lab-on-Chip · Series 7",
    description:
      "Droplet generation at 8,000 Hz enabling single-cell encapsulation for high-throughput genomic screening.",
    year: "2023",
    accentColor: "#c9f53b",
    image: null as never,
    orderRank: 3,
  },
  {
    _id: "s4",
    label: "Neural Interface",
    category: "Neurotech · Prototype III",
    description:
      "256-channel cortical recording array achieving simultaneous readout from prefrontal and hippocampal regions.",
    year: "2024",
    accentColor: "#a8d62a",
    image: null as never,
    orderRank: 4,
  },
  {
    _id: "s5",
    label: "Quantum Sensing",
    category: "Quantum Lab · Cryogenic",
    description:
      "NV-center diamond magnetometer operating at 15mK detecting sub-femtotesla magnetic anomalies.",
    year: "2024",
    accentColor: "#c9f53b",
    image: null as never,
    orderRank: 5,
  },
];

// Cloudinary fallback image URLs for the fallback slides (same order as FALLBACK_SLIDES)
const FALLBACK_URLS: string[] = [
  "https://res.cloudinary.com/dvky83edw/image/upload/v1774103610/iot/2839f291-11e1-47bf-bf72-c56c2bc3b861.png",
  "https://res.cloudinary.com/dvky83edw/image/upload/v1774104001/iot/08182265-1d07-4b60-ac81-72aed66b0956.png",
  "https://res.cloudinary.com/dvky83edw/image/upload/v1774099272/iot/4c5adcf5-81ae-45d4-a989-71dd48f6b1aa_de6560.png",
  "https://res.cloudinary.com/dvky83edw/image/upload/v1774099485/iot/630b65d2-c9eb-46dc-81a0-afde5664f0ee.png",
  "https://res.cloudinary.com/dvky83edw/image/upload/v1774103669/iot/e7aa4373-5920-499d-af38-7d109e14ecef.png",
];

function getSlideImageUrl(slide: GallerySlideData, index: number): string {
  if (slide.image) {
    return urlFor(slide.image).width(1920).quality(85).url();
  }
  return FALLBACK_URLS[index % FALLBACK_URLS.length];
}

interface LabCarouselProps {
  slides?: GallerySlideData[] | null;
}

export default function LabCarousel({ slides: propSlides }: LabCarouselProps) {
  const slides =
    propSlides && propSlides.length > 0 ? propSlides : FALLBACK_SLIDES;

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

  const total = slides.length;
  const dragStart = useRef(0);
  const dragX = useRef(0);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      gsap.set(nextSlide, { x: dir * slideW, opacity: 1, zIndex: 2 });
      gsap.set(currentSlide, { zIndex: 1 });

      tl.to(overlayRef.current, { opacity: 0.35, duration: 0.18, ease: "power2.in" });
      tl.to(currentSlide, { x: -dir * slideW * 0.3, opacity: 0, duration: 0.72, ease: "expo.inOut" }, "<");
      tl.to(nextSlide, { x: 0, opacity: 1, duration: 0.72, ease: "expo.inOut" }, "<");
      tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.25");
      tl.to(
        [titleRef.current, descRef.current, metaRef.current],
        { y: dir * 20, opacity: 0, duration: 0.3, ease: "power2.in", stagger: 0.04 },
        0.1,
      );
      tl.set([titleRef.current, descRef.current, metaRef.current], { y: -dir * 20 });
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
      tl.to(
        progressBarRef.current,
        { scaleX: (next + 1) / total, duration: 0.72, ease: "expo.inOut" },
        0,
      );

      if (counterRef.current) {
        const obj = { val: current + 1 };
        tl.to(
          obj,
          {
            val: next + 1,
            duration: 0.5,
            onUpdate: () => {
              if (counterRef.current)
                counterRef.current.textContent = String(Math.round(obj.val)).padStart(2, "0");
            },
          },
          0,
        );
      }
    },
    [current, isAnimating, total],
  );

  const next = useCallback(() => goTo((current + 1) % total, 1), [current, goTo, total]);
  const prev = useCallback(() => goTo((current - 1 + total) % total, -1), [current, goTo, total]);

  const resetAutoplay = useCallback(() => {
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    autoplayTimer.current = setTimeout(next, 5000);
  }, [next]);

  useEffect(() => {
    resetAutoplay();
    return () => { if (autoplayTimer.current) clearTimeout(autoplayTimer.current); };
  }, [current, resetAutoplay]);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

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
    gsap.to(slidesRef.current[current], { x: 0, duration: 0.4, ease: "elastic.out(1,0.6)" });
    if (dragX.current < -60) next();
    else if (dragX.current > 60) prev();
  };

  const slide = slides[current];
  const accentColor = slide.accentColor || "#c9f53b";

  return (
    <section className="relative w-full bg-background transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-20 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute pointer-events-none top-[10%] left-[-6%] w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(201,245,59,0.08)_0%,transparent_65%)] blur-[2px] z-0" />
      <div className="absolute pointer-events-none top-[30%] right-[-5%] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.09)_0%,transparent_65%)] blur-[2px] z-0" />
      <div className="absolute pointer-events-none bottom-[10%] left-[30%] w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.07)_0%,transparent_65%)] blur-[2px] z-0" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-20 flex items-center gap-4">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-primary text-[20px] font-bold tracking-[0.4em] uppercase py-10">
          ◆ Research Gallery ◆
        </span>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none h-[90vh] min-h-[520px] max-h-[900px]"
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
          {slides.map((s, i) => (
            <div
              key={s._id}
              ref={(el) => { if (el) slidesRef.current[i] = el; }}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translateX(${i === 0 ? "0" : "100%"})`,
                opacity: i === 0 ? 1 : 0,
                zIndex: i === 0 ? 1 : 0,
              }}
            >
              <img
                src={getSlideImageUrl(s, i)}
                alt={s.label}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c]/95 via-[#0c0c0c]/60 to-[#0c0c0c]/15" />
              <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)]" />
            </div>
          ))}
        </div>

        {/* Flash overlay */}
        <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-20 opacity-0 bg-primary" />

        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-mono">
              IEDC Research Laboratory
            </span>
          </div>
          <span
            className="text-[10px] tracking-widest border px-3 py-1 font-mono"
            style={{ color: accentColor, borderColor: accentColor + "44" }}
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
            <div className="h-px w-12 flex-shrink-0" style={{ backgroundColor: accentColor }} />
            <span
              className="text-[10px] tracking-[0.3em] uppercase font-semibold font-mono"
              style={{ color: accentColor }}
            >
              {slide.category}
            </span>
          </div>
          <h2
            ref={titleRef}
            className="text-5xl md:text-7xl xl:text-8xl font-bold text-white leading-none mb-5 font-['Bebas_Neue'] tracking-[0.02em]"
          >
            {slide.label}
          </h2>
          <p ref={descRef} className="max-w-lg text-sm md:text-base text-white/55 leading-relaxed mb-6">
            {slide.description}
          </p>

          {/* Counter + nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1 font-mono">
              <span ref={counterRef} className="text-2xl font-bold tabular-nums" style={{ color: accentColor }}>
                {String(current + 1).padStart(2, "0")}
              </span>
              <span className="text-white/25 text-sm mx-1">/</span>
              <span className="text-white/30 text-sm tabular-nums">{String(total).padStart(2, "0")}</span>
            </div>
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={prev}
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/50 hover:border-primary/60 hover:text-primary transition-all duration-300 rounded-sm cursor-pointer"
                aria-label="Previous"
              >←</button>
              <button
                onClick={next}
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/50 hover:border-primary/60 hover:text-primary transition-all duration-300 rounded-sm cursor-pointer"
                aria-label="Next"
              >→</button>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > current ? 1 : -1)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    width: i === current ? 24 : 6,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i === current ? accentColor : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="relative h-px bg-foreground/10">
            <div
              ref={progressBarRef}
              className="absolute top-0 left-0 h-full origin-left w-full"
              style={{ backgroundColor: accentColor, transform: "scaleX(0.2)" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom bleed */}
      <div className="pointer-events-none h-15 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}

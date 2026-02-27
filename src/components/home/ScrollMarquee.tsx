"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  value: string;
  label: string;
  icon: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatCard[] = [
  { value: "400+", label: "Students", icon: "◈" },
  { value: "20+", label: "Faculty", icon: "◉" },
  { value: "150+", label: "Projects", icon: "◆" },
  { value: "95%", label: "Placement Rate", icon: "◎" },
  { value: "30+", label: "Industry Partners", icon: "◈" },
  { value: "12", label: "Research Labs", icon: "◉" },
  { value: "50+", label: "Publications", icon: "◆" },
  { value: "8", label: "Awards Won", icon: "◎" },
];

// Triple-duplicate for seamless infinite loop
const ROW1 = [...STATS, ...STATS, ...STATS];
const ROW2 = [...STATS, ...STATS, ...STATS];

// ─── Card ─────────────────────────────────────────────────────────────────────
function StatCardItem({ stat }: { stat: StatCard }) {
  return (
    <div
      className="
        relative flex-shrink-0
        w-52 h-36
        mx-3
        rounded-2xl
        border border-white/[0.08]
        bg-white/[0.03]
        backdrop-blur-sm
        overflow-hidden
        group
        cursor-default
        select-none
        transition-all duration-500
        hover:border-[#c9f53b]/40
        hover:bg-white/[0.06]
      "
    >
      {/* Hover glow */}
      <div
        className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        bg-gradient-to-br from-[#c9f53b]/10 via-transparent to-transparent
        pointer-events-none
      "
      />

      {/* Corner accent */}
      <div
        className="
        absolute top-0 right-0 w-16 h-16
        bg-gradient-to-bl from-[#c9f53b]/20 to-transparent
        rounded-bl-3xl pointer-events-none
      "
      />

      {/* Decorative icon */}
      <span
        className="
        absolute top-4 left-4 text-[#c9f53b]/40 text-xs tracking-widest font-mono
        group-hover:text-[#c9f53b] transition-colors duration-300
      "
      >
        {stat.icon}
      </span>

      {/* Content */}
      <div className="absolute bottom-4 left-5 right-5">
        <div
          className="font-black text-4xl leading-none text-[#c9f53b] tracking-tight"
          style={{ fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif" }}
        >
          {stat.value}
        </div>
        <div
          className="
          mt-1 text-[10px] uppercase tracking-[0.2em]
          text-white/35 group-hover:text-white/65
          transition-colors duration-300 font-semibold
        "
        >
          {stat.label}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VelocityMarquee() {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // ── Velocity-based marquee animation ──────────────────────────────────────
  useEffect(() => {
    if (!row1Ref.current || !row2Ref.current) return;

    const getRowWidth = (el: HTMLDivElement) => el.scrollWidth / 3;

    let x1 = 0; // row1 moves LEFT
    let x2 = -getRowWidth(row2Ref.current); // row2 moves RIGHT, starts offset
    const BASE = 2.0; // px per frame baseline
    let velocityBoost = 12;
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let rafId: number;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 16.67, 4);
      lastTime = now;

      const scrollDelta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;

      // Ease velocity boost toward scroll delta, decay toward 0
      velocityBoost = lerp(velocityBoost, scrollDelta * 0.6, 0.18);

      const speed = (BASE + Math.abs(velocityBoost)) * dt;

      x1 -= speed; // left
      x2 += speed; // right

      const w1 = getRowWidth(row1Ref.current!);
      const w2 = getRowWidth(row2Ref.current!);

      // Seamless reset
      if (Math.abs(x1) >= w1) x1 = 0;
      if (x2 >= 0) x2 = -w2;

      gsap.set(row1Ref.current, { x: x1, force3D: true });
      gsap.set(row2Ref.current, { x: x2, force3D: true });

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Scroll-triggered section reveal ───────────────────────────────────────
  useEffect(() => {
    if (!sectionRef.current) return;
    const els = sectionRef.current.querySelectorAll(".fade-up");

    gsap.fromTo(
      els,
      { y: 70, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
        },
      },
    );
  }, []);

  return (
    <>
      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Sora', sans-serif; background: #0c0c0c; }
      `}</style>

      <div className=" text-white overflow-x-hidden w-full">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center justify-start text-center px-6 pt-16 pb-8">
          {/* Gradient blobs */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-10%",
              left: "-8%",
              width: 480,
              height: 480,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)",
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: "0%",
              right: "-5%",
              width: 360,
              height: 360,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(201,245,59,0.09) 0%, transparent 65%)",
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "-20%",
              left: "35%",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(219,39,119,0.08) 0%, transparent 65%)",
              filter: "blur(1px)",
            }}
          />
          {/* Background glow */}

          <p className="text-[#c9f53b] text-[10px] tracking-[0.45em] uppercase font-semibold mb-8">
            ◆ Innovation and Entrepreneurship Development Cell ◆
          </p>

          <h1
            className="text-[clamp(4.5rem,13vw,9rem)] leading-[0.86] font-black uppercase text-white mb-8 relative"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Numbers
            <br />
            <span className="text-[#c9f53b]">That</span>{" "}
            <span className="relative inline-block">
              Speak
              {/* underline accent */}
              <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-[#c9f53b]/40 rounded-full" />
            </span>
          </h1>
        </section>

        {/* ── Stats Marquee ─────────────────────────────────────────────────── */}
        <section ref={sectionRef} className="relative overflow-hidden">
          {/* Edge fade masks */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-48
            bg-gradient-to-r from-[#0c0c0c] to-transparent z-10"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-48
            bg-gradient-to-l from-[#0c0c0c] to-transparent z-10"
          />

          {/* ── Row 1: LEFT ── */}
          <div className="fade-up mb-4 flex overflow-hidden">
            <div ref={row1Ref} className="flex will-change-transform">
              {ROW1.map((stat, i) => (
                <StatCardItem key={`r1-${i}`} stat={stat} />
              ))}
            </div>
          </div>

          {/* ── Row 2: RIGHT ── */}
          <div className="fade-up flex overflow-hidden">
            <div ref={row2Ref} className="flex will-change-transform">
              {ROW2.map((stat, i) => (
                <StatCardItem key={`r2-${i}`} stat={stat} />
              ))}
            </div>
          </div>
        </section>

        {/* bottom blend seam */}

      </div>
    </>
  );
}

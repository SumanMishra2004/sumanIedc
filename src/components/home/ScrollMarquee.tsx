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
        border border-border/40 dark:border-white/[0.08]
        bg-muted/10 dark:bg-white/[0.03]
        backdrop-blur-sm
        overflow-hidden
        group
        cursor-default
        select-none
        transition-all duration-500
        hover:border-primary/40
        hover:bg-muted/20 dark:hover:bg-white/[0.06]
      "
    >
      {/* Hover glow */}
      <div
        className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        bg-gradient-to-br from-primary/10 via-transparent to-transparent
        pointer-events-none
      "
      />

      {/* Corner accent */}
      <div
        className="
        absolute top-0 right-0 w-16 h-16
        bg-gradient-to-bl from-primary/20 to-transparent
        rounded-bl-3xl pointer-events-none
      "
      />

      {/* Decorative icon */}
      <span
        className="
        absolute top-4 left-4 text-primary/40 text-xs tracking-widest font-mono
        group-hover:text-primary transition-colors duration-300
      "
      >
        {stat.icon}
      </span>

      {/* Content */}
      <div className="absolute bottom-4 left-5 right-5">
        <div
          className="font-black text-4xl leading-none text-primary tracking-tight font-['Bebas_Neue']"
        >
          {stat.value}
        </div>
        <div
          className="
          mt-1 text-[10px] uppercase tracking-[0.2em]
          text-foreground/45 dark:text-white/35 group-hover:text-foreground/75 dark:group-hover:text-white/65
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
interface VelocityMarqueeProps {
  subtitle?: string;
  title?: string;
  stats?: any[] | null;
}

export default function VelocityMarquee({ subtitle, title, stats }: VelocityMarqueeProps) {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const finalSubtitle = subtitle || "◆ Innovation and Entrepreneurship Development Cell ◆";
  const finalTitle = title || "Numbers That Speak";
  const statsList = (stats && stats.length > 0) ? stats : STATS;

  const row1Items = [...statsList, ...statsList, ...statsList];
  const row2Items = [...statsList, ...statsList, ...statsList];

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
  }, [statsList]); // reset if stats change

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

  const renderTitle = () => {
    const words = finalTitle.split(" ");
    if (words.length <= 1) {
      return (
        <h1 className="text-[clamp(4.5rem,13vw,9rem)] leading-[0.86] font-black uppercase text-foreground mb-8 relative font-['Bebas_Neue']">
          <span className="relative inline-block">
            {finalTitle}
            <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-primary/40 rounded-full" />
          </span>
        </h1>
      );
    }
    if (words.length === 2) {
      return (
        <h1 className="text-[clamp(4.5rem,13vw,9rem)] leading-[0.86] font-black uppercase text-foreground mb-8 relative font-['Bebas_Neue']">
          {words[0]}
          <br />
          <span className="relative inline-block text-primary">
            {words[1]}
            <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-primary/40 rounded-full" />
          </span>
        </h1>
      );
    }
    // 3 or more words: e.g. "Numbers That Speak"
    const firstPart = words.slice(0, words.length - 2).join(" ");
    const highlightWord = words[words.length - 2];
    const underlineWord = words[words.length - 1];
    return (
      <h1 className="text-[clamp(4.5rem,13vw,9rem)] leading-[0.86] font-black uppercase text-foreground mb-8 relative font-['Bebas_Neue']">
        {firstPart}
        <br />
        <span className="text-primary">{highlightWord}</span>{" "}
        <span className="relative inline-block">
          {underlineWord}
          <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-primary/40 rounded-full" />
        </span>
      </h1>
    );
  };

  return (
    <div className="text-foreground overflow-x-hidden w-full bg-background transition-colors duration-300">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-start text-center px-6 pt-16 pb-8">
        {/* Gradient blobs */}
        <div
          className="absolute pointer-events-none top-[-10%] left-[-8%] w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.1)_0%,transparent_65%)] blur-[1px]"
        />
        <div
          className="absolute pointer-events-none top-0 right-[-5%] w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(201,245,59,0.09)_0%,transparent_65%)] blur-[1px]"
        />
        <div
          className="absolute pointer-events-none bottom-[-20%] left-[35%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.08)_0%,transparent_65%)] blur-[1px]"
        />
        {/* Background glow */}

        <p className="text-primary text-[10px] tracking-[0.45em] uppercase font-semibold mb-8">
          {finalSubtitle}
        </p>

        {renderTitle()}
      </section>

      {/* ── Stats Marquee ─────────────────────────────────────────────────── */}
      <section ref={sectionRef} className="relative overflow-hidden">
        {/* Edge fade masks */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-background to-transparent z-10"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-background to-transparent z-10"
        />

        {/* ── Row 1: LEFT ── */}
        <div className="fade-up mb-4 flex overflow-hidden">
          <div ref={row1Ref} className="flex will-change-transform">
            {row1Items.map((stat, i) => (
              <StatCardItem key={`r1-${i}`} stat={stat} />
            ))}
          </div>
        </div>

        {/* ── Row 2: RIGHT ── */}
        <div className="fade-up flex overflow-hidden">
          <div ref={row2Ref} className="flex will-change-transform">
            {row2Items.map((stat, i) => (
              <StatCardItem key={`r2-${i}`} stat={stat} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    ScrollTrigger.create({
      trigger: ref.current,
      start: "top 90%",
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

/* ── Main ─────────────────────────────────────────────────────── */
export default function StatsStrip({ data }: { data?: any[] | null }) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!rowRef.current) return;
      const cards = rowRef.current.querySelectorAll(".stat-card");

      // Set initial state via GSAP so Tailwind doesn't conflict
      gsap.set(cards, { opacity: 0, y: 40, rotateX: -10 });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.09,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rowRef.current,
          start: "top 100%", // fires as soon as any part enters viewport
          once: true,
        },
      });
    }, rowRef);
    return () => ctx.revert();
  }, []);

  const statsList = (data && data.length > 0) ? data : stats;

  return (
    <div
      ref={rowRef}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/20 border-y border-border/40 [perspective:1000px] w-full"
    >
      {statsList.map((s, i) => (
        <div
          key={i}
          className="stat-card bg-background dark:bg-card text-foreground px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative cursor-default overflow-hidden hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors duration-300 group"
        >
          {/* left accent bar */}
          <div className="absolute bottom-0 left-0 w-[3px] h-full bg-primary scale-y-0 transition-transform duration-300 origin-bottom group-hover:scale-y-100" />

          {/* number */}
          <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none mb-3 text-foreground transition-colors duration-300 group-hover:text-primary font-['Syne']">
            {s.prefix ?? ""}
            <Counter target={parseInt(s.value)} duration={2} />
            {s.suffix}
          </div>

          <div className="text-[13px] font-semibold tracking-wider uppercase mb-1.5 text-foreground">
            {s.label}
          </div>
          <div className="text-[12px] text-foreground/45 dark:text-white/35 leading-normal">
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

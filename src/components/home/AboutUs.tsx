"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


gsap.registerPlugin(ScrollTrigger);

function AnimatedParagraph({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const words = containerRef.current?.querySelectorAll(".word");
    if (!words) return;

    gsap.set(words, { opacity: 0.12 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        end: "bottom 30%",
        scrub: 1.2,
      },
    });

    tl.to(words, {
      opacity: 1,
      stagger: 0.08,
      ease: "none",
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === containerRef.current) st.kill();
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-wrap gap-x-[0.35em] gap-y-1 justify-center">
      {text.split(" ").map((word, i) => (
        <span key={i} className="word inline-block will-change-[opacity]">
          {word}
        </span>
      ))}
    </div>
  );
}


/* ─── Main Component ──────────────────────────────── */
export default function AboutUs() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const orbContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: 60, skewY: 2 },
      {
        opacity: 1,
        y: 0,
        skewY: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
      },
    );
    gsap.fromTo(
      decorRef.current,
      { scaleX: 0, transformOrigin: "left" },
      {
        scaleX: 1,
        duration: 1.4,
        ease: "expo.out",
        delay: 0.3,
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
      },
    );

    if (orbContainerRef.current) {
      gsap.fromTo(
        orbContainerRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.5,
          ease: "back.out(1.2)",
          scrollTrigger: { trigger: orbContainerRef.current, start: "top 80%" },
        },
      );
    }

    return () => ScrollTrigger.getAll().forEach((st) => st.kill());
  }, []);

  return (
    <section
      className="relative min-h-screen w-full px-4 sm:px-8 lg:px-16 overflow-hidden pb-5 z-[5] bg-background transition-colors duration-300 font-sans"
    >
      {/* Top gradient that blends from the hero's bottom colour */}
      <div
        className="absolute inset-x-0 top-0 h-[220px] pointer-events-none z-0 bg-gradient-to-b from-background to-transparent"
      />
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none bg-[radial-gradient(circle,rgba(201,245,59,0.6)_1px,transparent_1px)] bg-[size:32px_32px]"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-[radial-gradient(circle,rgba(201,245,59,0.06)_0%,transparent_70%)]" />
      {/* Additional ambient blobs — purple top-left, pink bottom-right */}
      <div className="absolute pointer-events-none top-[8%] left-[-6%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.09)_0%,transparent_65%)] blur-[2px]" />
      <div className="absolute pointer-events-none bottom-[6%] right-[-4%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.09)_0%,transparent_65%)] blur-[2px]" />
      <div className="absolute pointer-events-none top-[55%] left-[60%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(201,245,59,0.06)_0%,transparent_65%)] blur-[2px]" />

      <div className="relative z-10 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center mb-24">
          <span className="text-primary text-xs font-bold tracking-[0.35em] uppercase mb-6 block">
            ◆ Who We Are ◆
          </span>
          <h2
            ref={headingRef}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] mb-6 opacity-0 font-['Bebas_Neue'] tracking-[0.02em]"
          >
            Crafting{" "}
            <em className="text-primary not-italic">
              stories
            </em>
            <br />
            that resonate.
          </h2>
          <div
            ref={decorRef}
            className="h-[2px] w-24 bg-primary/60 mb-12 origin-left"
          />
          <div
            ref={subRef}
            className="max-w-4xl text-xl sm:text-2xl font-light text-foreground/80 leading-relaxed"
          >
            <AnimatedParagraph text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque est recusandae voluptatibus aperiam molestiae tempora sed ut ab! Cumque animi magnam natus consequatur asperiores hic fugiat voluptatem odit in ipsa. Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut at autem non dicta? Nemo aut officiis accusamus, placeat quis ut. Vero suscipit ea aperiam deleniti dicta magni eveniet obcaecati officia?" />
          </div>
        </div>

        <div className="flex justify-center mt-20">
          <button className="group relative px-10 py-4 border border-primary/45 text-foreground text-sm font-bold tracking-widest uppercase hover:text-background transition-all duration-500 rounded-full overflow-hidden shadow-[0_0_20px_rgba(201,245,59,0.12)]">
            <span className="relative z-10">Explore More</span>
            <span className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </button>
        </div>
      </div>
    </section>
  );
}

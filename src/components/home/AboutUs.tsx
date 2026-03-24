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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;700&display=swap');
        @keyframes globeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes globeSpinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

        /* Dynamic Mask Cutouts for the Grid Gap intersection (160px radius + 15px gap = 175px cutout) */
        @media (min-width: 1024px) {
          .card-cutout-top {
            -webkit-mask-image: radial-gradient(circle at 50% calc(100% + 8px), transparent 160px, black 176px);
            mask-image: radial-gradient(circle at 50% calc(100% + 8px), transparent 160px, black 176px);
          }
          .card-cutout-bot-left {
            -webkit-mask-image: radial-gradient(circle at calc(100% + 8px) -8px, transparent 160px, black 176px);
            mask-image: radial-gradient(circle at calc(100% + 8px) -8px, transparent 160px, black 176px);
          }
          .card-cutout-bot-right {
            -webkit-mask-image: radial-gradient(circle at -8px -8px, transparent 160px, black 176px);
            mask-image: radial-gradient(circle at -8px -8px, transparent 160px, black 176px);
          }
        }
      `}</style>

      <section
        className="relative min-h-screen w-full px-4 sm:px-8 lg:px-16 overflow-hidden "
        style={{
          fontFamily: "'DM Sans', sans-serif",
          paddingBottom: 20,
          position: "relative",
          zIndex: 5,
          background: "#0c0c0c",
        }}
      >
        {/* Top gradient that blends from the hero's bottom colour */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 220,
        background: "linear-gradient(to bottom, #0c0c0c 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(201,245,59,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(201,245,59,0.06) 0%, transparent 70%)" }} />
        {/* Additional ambient blobs — purple top-left, pink bottom-right */}
        <div className="absolute pointer-events-none" style={{ top: "8%", left: "-6%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 65%)", filter: "blur(2px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "6%", right: "-4%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(219,39,119,0.09) 0%, transparent 65%)", filter: "blur(2px)" }} />
        <div className="absolute pointer-events-none" style={{ top: "55%", left: "60%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,245,59,0.06) 0%, transparent 65%)", filter: "blur(2px)" }} />

        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="flex flex-col items-center text-center mb-24">
            <span className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-6 block">
              ◆ Who We Are ◆
            </span>
            <h2
              ref={headingRef}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 opacity-0"
              style={{ fontFamily: "'Bebas Neue','Arial Narrow',sans-serif", letterSpacing: "0.02em" }}
            >
              Crafting{" "}
              <em className="text-[#c9f53b] not-italic">
                stories
              </em>
              <br />
              that resonate.
            </h2>
            <div
              ref={decorRef}
              className="h-[2px] w-24 bg-[#c9f53b]/60 mb-12"
              style={{ transformOrigin: "left" }}
            />
            <div
              ref={subRef}
              className="max-w-4xl text-xl sm:text-2xl font-light text-white/80 leading-relaxed"
            >
              <AnimatedParagraph text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque est recusandae voluptatibus aperiam molestiae tempora sed ut ab! Cumque animi magnam natus consequatur asperiores hic fugiat voluptatem odit in ipsa. Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut at autem non dicta? Nemo aut officiis accusamus, placeat quis ut. Vero suscipit ea aperiam deleniti dicta magni eveniet obcaecati officia?" />
            </div>
          </div>

         

          <div className="flex justify-center mt-20">
            <button className="group relative px-10 py-4 border border-[#c9f53b]/40 text-white text-sm font-bold tracking-widest uppercase hover:text-black transition-all duration-500 rounded-full overflow-hidden shadow-[0_0_20px_rgba(201,245,59,0.12)]">
              <span className="relative z-10">Explore More</span>
              <span className="absolute inset-0 bg-[#c9f53b] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

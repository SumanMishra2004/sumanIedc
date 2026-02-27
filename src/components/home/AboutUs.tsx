"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { World, type GlobeConfig, type Position } from "./GlobeComponent";

gsap.registerPlugin(ScrollTrigger);

/* ─── Bento Card Data ─────────────────────────────── */
const bentoItems = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    label: "Effortless Prompt Perfection",
    desc: "14 days trial • after $5/month",
    size: "tall",
    showOnMobile: true,
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=800&q=80",
    label: "Your AI Prompt Companion",
    desc: "PromptPal",
    size: "large",
    showOnMobile: true,
    maskClass: "card-cutout-top", // Cuts the bottom center
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    label: "Settings",
    desc: "Toggle",
    size: "normal",
    showOnMobile: false,
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    label: "25M+",
    desc: "created prompts",
    size: "normal",
    showOnMobile: true,
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    label: "12K",
    desc: "happy users",
    size: "normal",
    showOnMobile: true,
  },
  {
    id: 6,
    img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    label: "Branching paths",
    desc: "Explore multiple prompt directions with branching.",
    size: "tall",
    showOnMobile: false,
    maskClass: "card-cutout-bot-left", // Cuts the top right
  },
  {
    id: 7,
    img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    label: "Keyword enhancer",
    desc: "Boost your prompt precision with keywords.",
    size: "tall",
    showOnMobile: false,
    maskClass: "card-cutout-bot-right", // Cuts the top left
  },
  {
    id: 8,
    img: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&q=80",
    label: "Prompt templates",
    desc: "Use pre-made templates to jumpstart creativity.",
    size: "tall",
    showOnMobile: false,
  },
  {
    id: 9,
    img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    label: "Generate",
    desc: "Start creating now",
    size: "normal",
    showOnMobile: true,
  },
];

/* ─── Globe Config & Arc Data ─────────────────────── */
const globeConfig: GlobeConfig = {
  pointSize: 4,
  globeColor: "#062050",
  showAtmosphere: true,
  atmosphereColor: "#ffffff",
  atmosphereAltitude: 0.1,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgb(255,255,255)",
  ambientLight: "#c9f53b",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 2000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 8,
  autoRotate: true,
  autoRotateSpeed: 4,
};

const globeArcs: Position[] = [
  // Original routes
  { order: 1,  startLat: 28.6,   startLng: 77.2,    endLat: 51.5,   endLng: -0.1,    arcAlt: 0.3,  color: "#c9f53b" },
  { order: 2,  startLat: 40.7,   startLng: -74.0,   endLat: 48.9,   endLng: 2.3,     arcAlt: 0.3,  color: "#a8d62a" },
  { order: 3,  startLat: 35.7,   startLng: 139.7,   endLat: 37.6,   endLng: -122.4,  arcAlt: 0.4,  color: "#c9f53b" },
  { order: 4,  startLat: -33.9,  startLng: 151.2,   endLat: 1.3,    endLng: 103.8,   arcAlt: 0.4,  color: "#ffffff" },
  { order: 5,  startLat: 55.8,   startLng: 37.6,    endLat: 52.5,   endLng: 13.4,    arcAlt: 0.2,  color: "#c9f53b" },
  { order: 6,  startLat: 22.3,   startLng: 114.2,   endLat: 35.7,   endLng: 139.7,   arcAlt: 0.2,  color: "#a8d62a" },
  { order: 7,  startLat: -23.5,  startLng: -46.6,   endLat: 40.7,   endLng: -74.0,   arcAlt: 0.4,  color: "#c9f53b" },
  { order: 8,  startLat: 48.9,   startLng: 2.3,     endLat: 55.8,   endLng: 37.6,    arcAlt: 0.2,  color: "#ffffff" },
  { order: 9,  startLat: 19.1,   startLng: 72.9,    endLat: 25.2,   endLng: 55.3,    arcAlt: 0.2,  color: "#c9f53b" },
  { order: 10, startLat: 37.6,   startLng: -122.4,  endLat: -33.9,  endLng: 151.2,   arcAlt: 0.4,  color: "#a8d62a" },
  { order: 11, startLat: 51.5,   startLng: -0.1,    endLat: 40.7,   endLng: -74.0,   arcAlt: 0.3,  color: "#c9f53b" },
  { order: 12, startLat: 1.3,    startLng: 103.8,   endLat: 28.6,   endLng: 77.2,    arcAlt: 0.3,  color: "#ffffff" },
  // Additional routes — Africa, Middle East, South America, Europe, Asia-Pacific
  { order: 13, startLat: -1.3,   startLng: 36.8,    endLat: 30.1,   endLng: 31.2,    arcAlt: 0.25, color: "#c9f53b" }, // Nairobi → Cairo
  { order: 14, startLat: 6.5,    startLng: 3.4,     endLat: 48.9,   endLng: 2.3,     arcAlt: 0.35, color: "#a8d62a" }, // Lagos → Paris
  { order: 15, startLat: 33.9,   startLng: -6.9,    endLat: 40.4,   endLng: -3.7,    arcAlt: 0.15, color: "#ffffff" }, // Casablanca → Madrid
  { order: 16, startLat: 55.8,   startLng: 37.6,    endLat: 39.9,   endLng: 116.4,   arcAlt: 0.35, color: "#c9f53b" }, // Moscow → Beijing
  { order: 17, startLat: 39.9,   startLng: 116.4,   endLat: 28.6,   endLng: 77.2,    arcAlt: 0.2,  color: "#a8d62a" }, // Beijing → Delhi
  { order: 18, startLat: 13.1,   startLng: 80.3,    endLat: 1.3,    endLng: 103.8,   arcAlt: 0.2,  color: "#c9f53b" }, // Chennai → Singapore
  { order: 19, startLat: -34.6,  startLng: -58.4,   endLat: 4.7,    endLng: -74.1,   arcAlt: 0.25, color: "#ffffff" }, // Buenos Aires → Bogotá
  { order: 20, startLat: -33.5,  startLng: -70.7,   endLat: -23.5,  endLng: -46.6,   arcAlt: 0.2,  color: "#c9f53b" }, // Santiago → São Paulo
  { order: 21, startLat: 64.1,   startLng: -21.9,   endLat: 51.5,   endLng: -0.1,    arcAlt: 0.2,  color: "#a8d62a" }, // Reykjavik → London
  { order: 22, startLat: 59.9,   startLng: 10.7,    endLat: 52.5,   endLng: 13.4,    arcAlt: 0.15, color: "#c9f53b" }, // Oslo → Berlin
  { order: 23, startLat: 41.0,   startLng: 29.0,    endLat: 48.9,   endLng: 2.3,     arcAlt: 0.2,  color: "#ffffff" }, // Istanbul → Paris
  { order: 24, startLat: 25.2,   startLng: 55.3,    endLat: 51.5,   endLng: -0.1,    arcAlt: 0.3,  color: "#c9f53b" }, // Dubai → London
  { order: 25, startLat: 24.7,   startLng: 46.7,    endLat: 40.7,   endLng: -74.0,   arcAlt: 0.4,  color: "#a8d62a" }, // Riyadh → New York
  { order: 26, startLat: 43.7,   startLng: -79.4,   endLat: 51.5,   endLng: -0.1,    arcAlt: 0.3,  color: "#c9f53b" }, // Toronto → London
  { order: 27, startLat: 19.4,   startLng: -99.1,   endLat: 40.7,   endLng: -74.0,   arcAlt: 0.25, color: "#ffffff" }, // Mexico City → New York
  { order: 28, startLat: -26.2,  startLng: 28.0,    endLat: 51.5,   endLng: -0.1,    arcAlt: 0.45, color: "#c9f53b" }, // Johannesburg → London
  { order: 29, startLat: 31.2,   startLng: 121.5,   endLat: 37.6,   endLng: -122.4,  arcAlt: 0.4,  color: "#a8d62a" }, // Shanghai → San Francisco
  { order: 30, startLat: 13.8,   startLng: 100.5,   endLat: 35.7,   endLng: 139.7,   arcAlt: 0.2,  color: "#c9f53b" }, // Bangkok → Tokyo
  { order: 31, startLat: -37.8,  startLng: 144.9,   endLat: 35.7,   endLng: 139.7,   arcAlt: 0.3,  color: "#ffffff" }, // Melbourne → Tokyo
  { order: 32, startLat: 52.5,   startLng: 13.4,    endLat: 40.7,   endLng: -74.0,   arcAlt: 0.35, color: "#c9f53b" }, // Berlin → New York
  { order: 33, startLat: 45.5,   startLng: -73.6,   endLat: -23.5,  endLng: -46.6,   arcAlt: 0.4,  color: "#a8d62a" }, // Montreal → São Paulo
  { order: 34, startLat: 60.2,   startLng: 25.0,    endLat: 55.8,   endLng: 37.6,    arcAlt: 0.15, color: "#c9f53b" }, // Helsinki → Moscow
  { order: 35, startLat: 23.1,   startLng: -82.4,   endLat: 40.7,   endLng: -74.0,   arcAlt: 0.2,  color: "#ffffff" }, // Havana → New York
  { order: 36, startLat: 14.6,   startLng: -90.5,   endLat: 19.4,   endLng: -99.1,   arcAlt: 0.15, color: "#c9f53b" }, // Guatemala City → Mexico City
  { order: 37, startLat: 3.1,    startLng: 101.7,   endLat: 22.3,   endLng: 114.2,   arcAlt: 0.15, color: "#a8d62a" }, // Kuala Lumpur → Hong Kong
  { order: 38, startLat: -4.3,   startLng: 15.3,    endLat: -1.3,   endLng: 36.8,    arcAlt: 0.2,  color: "#c9f53b" }, // Kinshasa → Nairobi
  { order: 39, startLat: 47.4,   startLng: 8.6,     endLat: 25.2,   endLng: 55.3,    arcAlt: 0.25, color: "#ffffff" }, // Zurich → Dubai
  { order: 40, startLat: 59.3,   startLng: 18.1,    endLat: 48.9,   endLng: 2.3,     arcAlt: 0.15, color: "#c9f53b" }, // Stockholm → Paris
];

/* ─── Scroll-Animated Word ────────────────────────── */
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

/* ─── Bento Card ──────────────────────────────────── */
function BentoCard({
  item,
  index,
}: {
  item: (typeof bentoItems)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const img = imgRef.current;
    const overlay = overlayRef.current;
    if (!card || !img || !overlay) return;

    gsap.set(img, { filter: "grayscale(100%) brightness(0.7)" });
    gsap.set(overlay, { opacity: 1 });
    gsap.set(card, { opacity: 0, y: 40, scale: 0.96 });

    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.9,
      ease: "expo.out",
      delay: index * 0.08,
      scrollTrigger: {
        trigger: card,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });

    gsap.to(img, {
      filter: "grayscale(0%) brightness(1)",
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 70%",
        end: "top 30%",
        scrub: 1,
      },
    });

    gsap.to(overlay, {
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: card,
        start: "top 70%",
        end: "top 30%",
        scrub: 1,
      },
    });

    const onEnter = () =>
      gsap.to(img, { scale: 1.08, duration: 0.6, ease: "power2.out" });
    const onLeave = () =>
      gsap.to(img, { scale: 1, duration: 0.6, ease: "power2.out" });

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);

    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [index]);

  const spanClass = {
    large: "lg:col-span-2 lg:row-span-2",
    tall: "lg:row-span-2",
    wide: "lg:col-span-2",
    normal: "lg:col-span-1 lg:row-span-1",
  }[item.size];

  const mobileVisibility = item.showOnMobile ? "flex" : "hidden lg:flex";

  return (
    <div
      ref={cardRef}
      className={`relative w-full h-full overflow-hidden rounded-2xl group cursor-pointer ${spanClass} ${mobileVisibility} flex-col ${item.maskClass || ""}`}
    >
      <Image
        ref={imgRef}
        src={item.img}
        alt={item.label}
        className="absolute inset-0 w-full h-full object-cover"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[#0c0c0c]/60 mix-blend-color pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c]/90 via-[#0c0c0c]/20 to-transparent flex flex-col justify-end p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <span className="text-[#c9f53b] text-xs font-semibold tracking-widest uppercase mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {item.label}
        </span>
        <h3
          className="text-white font-bold text-lg md:text-xl leading-tight"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {item.label}
        </h3>
        <p className="text-white/60 text-sm mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          {item.desc}
        </p>
      </div>
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#c9f53b] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(201,245,59,0.8)]" />
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

          <div className="relative w-full">
            {/* The Unified Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 auto-rows-[160px] md:auto-rows-[180px] lg:auto-rows-[200px] gap-4">
              {bentoItems.map((item, i) => (
                <BentoCard key={item.id} item={item} index={i} />
              ))} 
            </div>

            {/* THE OVERLAPPING CENTER GLOBE */}
            <div
              ref={orbContainerRef}
              className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] p-3 z-30"
            >
              {/* Glass bubble backdrop */}
            
          
           

              {/* 3D dotted globe canvas */}
              <div className="relative w-full h-full">
                <World globeConfig={globeConfig} data={globeArcs} />
              </div>
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

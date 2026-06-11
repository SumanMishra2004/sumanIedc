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
    img: "https://res.cloudinary.com/dvky83edw/image/upload/v1774099839/iot/6be548f0-60d7-4556-a311-20d28ee10539.png",
    tag: "Quantum Lab",
    title: "Frontier Computing",
    year: "2024",
  },
 
  {
    id: 4,
    img: "https://res.cloudinary.com/dvky83edw/image/upload/v1774069069/iot/tmfxgkzbopsbnchzvxj6.jpg",
    tag: "BioTech",
    title: "Living Systems",
    year: "2022",
  },
  {
    id: 5,
    img: "https://res.cloudinary.com/dvky83edw/image/upload/v1774069061/iot/gz6xi5bpbsfkxqbbuznh.jpg",
    tag: "AI & Vision",
    title: "Neural Horizons",
    year: "2022",
  },
  {
    id: 6,
    img: "https://res.cloudinary.com/dvky83edw/image/upload/v1774069038/iot/qsbabxitresgu15toxjf.jpg",
    tag: "Space Tech",
    title: "Orbital Systems",
    year: "2021",
  },
  {
    id: 7,
    img: "https://res.cloudinary.com/dvky83edw/image/upload/v1774069040/iot/tyuprntqnjtbgbet4svc.jpg",
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

  const [slides, setSlides] = useState<any[]>(() => [...BASE_SLIDES, ...BASE_SLIDES, ...BASE_SLIDES])
  const [nVal, setNVal] = useState(BASE_SLIDES.length)

  // activeReal: 0..nVal-1 (real slide index)
  const [activeReal, setActiveReal] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // virtualIdx: position in the slides triple array, starts at nVal (middle copy)
  const virtualIdx = useRef(BASE_SLIDES.length);
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
    const raf = requestAnimationFrame(() => applyCovertflow(nVal, false));
    return () => cancelAnimationFrame(raf);
  }, [applyCovertflow, nVal]);

  // Fetch dynamic achievements from backend
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const res = await fetch("/api/public/achievements")
        if (res.ok) {
          const data = await res.json()
          if (data.achievements && data.achievements.length > 0) {
            const formatted = data.achievements.map((a: any) => ({
              id: a.id,
              img: a.imageUrl || "https://res.cloudinary.com/dvky83edw/image/upload/v1774099839/iot/6be548f0-60d7-4556-a311-20d28ee10539.png",
              tag: a.category || "Achievement",
              title: a.title,
              year: a.year
            }))
            const tripled = [...formatted, ...formatted, ...formatted]
            setSlides(tripled)
            setNVal(formatted.length)
            virtualIdx.current = formatted.length
            setTimeout(() => {
              applyCovertflow(formatted.length, false)
            }, 50)
          }
        }
      } catch (err) {
        console.error("Error loading homepage achievements:", err)
      }
    }
    loadAchievements()
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
      const nextReal = ((nextVi % nVal) + nVal) % nVal;

      isAnimating.current = true;
      virtualIdx.current = nextVi;
      setActiveReal(nextReal);
      applyCovertflow(nextVi, true);

      // after animation, jump to middle copy if we've drifted
      gsap.delayedCall(0.6, () => {
        isAnimating.current = false;
        if (nextVi < nVal || nextVi >= nVal * 2) {
          const corrected = nVal + nextReal;
          virtualIdx.current = corrected;
          applyCovertflow(corrected, false);
        }
      });
    },
    [applyCovertflow, nVal],
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
      className="relative w-full overflow-hidden font-['Syne'] text-foreground bg-background transition-colors duration-300"
    >
      {/* grain */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-[radial-gradient(ellipse,rgba(201,245,59,0.07)_0%,transparent_70%)] pointer-events-none z-0"
      />
      {/* Ambient color blobs */}
      <div
        className="absolute top-[5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_65%)] pointer-events-none z-0 blur-[2px]"
      />
      <div
        className="absolute bottom-[10%] right-[-6%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.08)_0%,transparent_65%)] pointer-events-none z-0 blur-[2px]"
      />
      <div
        className="absolute bottom-[30%] left-[15%] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(201,245,59,0.05)_0%,transparent_65%)] pointer-events-none z-0 blur-[2px]"
      />

      <div className="relative z-10">
        {/* ── HEADER ── */}
        <div className="px-[6vw] py-12 md:py-20 lg:py-24">
          <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-primary mb-6">
            — Research & Glory
          </p>
          <h2
            ref={headingRef}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold font-['Syne'] tracking-tighter leading-[1.02] m-0 overflow-hidden"
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
                  <em className="font-normal italic text-primary">{w}</em>
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
            className="h-px bg-gradient-to-r from-primary to-transparent mt-12 origin-left"
          />
        </div>

        {/* ── STATS ── */}
        <div
          ref={statsRowRef}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/20 border-y border-border/40 [perspective:1000px]"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="stat-card bg-background dark:bg-card text-foreground px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative cursor-default overflow-hidden opacity-0 hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors duration-300 group"
            >
              <div
                className="sa absolute bottom-0 left-0 w-[3px] h-full bg-primary scale-y-0 transition-transform duration-300 origin-bottom group-hover:scale-y-100"
              />
              <div
                className="sn text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none mb-3 text-foreground transition-colors duration-300 group-hover:text-primary"
              >
                {s.prefix || ""}
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

        {/* ── COVERFLOW CAROUSEL ── */}
        <div
          ref={carouselRef}
          className="py-12 md:py-20 lg:py-24"
        >
          {/* header */}
          <div className="flex flex-wrap gap-6 items-end justify-between px-[6vw] mb-14">
            <div>
              <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-primary mb-3">
                — Visual Archive
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Syne'] tracking-tighter leading-none m-0 text-foreground">
                Labs & Breakthroughs
              </h3>
            </div>
            <div className="flex gap-3">
              {(["←", "→"] as const).map((arrow, dir) => (
                <button
                  key={dir}
                  onClick={() => navigate(dir === 0 ? -1 : 1)}
                  className="w-13 h-13 rounded-full border border-border/40 bg-transparent text-foreground text-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-primary hover:text-background hover:border-primary"
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>

          {/* coverflow viewport */}
          <div
            ref={viewportRef}
            className="relative h-[500px] overflow-hidden cursor-grab [perspective:1200px] [perspective-origin:50%_50%]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* edge fade masks */}
            <div
              className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(90deg,var(--background)_0%,transparent_20%,transparent_80%,var(--background)_100%)]"
            />

            {slides.map((slide, i) => {
              const realIndex = i % nVal;
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
                  className={`absolute top-5 left-0 w-[340px] h-[460px] rounded-[18px] overflow-hidden [transform-style:preserve-3d] opacity-0 will-change-[transform,filter,opacity] ${realIndex === activeReal ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* image */}
                  <div
                    className="absolute inset-[-4px] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${slide.img})`,
                    }}
                  />
                  {/* overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90"
                  />

                  {/* year badge */}
                  <div
                    className="absolute top-4 right-4 font-mono text-[11px] tracking-[0.15em] bg-foreground/10 backdrop-blur-md border border-foreground/15 rounded px-2.5 py-1 text-foreground"
                  >
                    {slide.year}
                  </div>

                  {/* text */}
                  <div
                    className="absolute bottom-6 left-6 right-6"
                  >
                    <p
                      className="font-mono text-[10px] tracking-[0.35em] uppercase text-primary mb-2"
                    >
                      {slide.tag}
                    </p>
                    <h4
                      className="text-[1.55rem] font-bold tracking-tight m-0 leading-[1.1] text-foreground font-['Syne']"
                    >
                      {slide.title}
                    </h4>
                  </div>

                  {/* active bottom line */}
                  {realIndex === activeReal && (
                    <div
                      className="absolute bottom-0 inset-x-0 h-[3px] bg-primary"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* dots + counter */}
          <div
            className="flex gap-2 px-[6vw] pt-8 items-center"
          >
            {Array.from({ length: nVal }).map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i - activeReal)}
                className={`h-2 rounded-full cursor-pointer p-0 border-0 transition-all duration-450 cubic-bezier(0.34,1.56,0.64,1) ${
                  i === activeReal ? "w-8 bg-primary" : "w-2 bg-foreground/20"
                }`}
              />
            ))}
            <span
              className="ml-auto font-mono text-[12px] text-foreground/35"
            >
              {String(activeReal + 1).padStart(2, "0")} /{" "}
              {String(nVal).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

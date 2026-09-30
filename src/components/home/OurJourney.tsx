"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, Rocket, Award, Cpu, Globe, Lightbulb, Star, Zap, type LucideIcon } from "lucide-react";
import type { MilestoneData } from "../../../sanity/lib/queries";

// Register GSAP ScrollTrigger plugin safely for SSR
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── Icon map from Sanity iconName string → Lucide component ─────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Rocket,
  Award,
  Cpu,
  Globe,
  Lightbulb,
  Star,
  Zap,
};

// ─── Fallback milestones (shown when Sanity has no data yet) ──────────────────
const FALLBACK_MILESTONES: MilestoneData[] = [
  {
    _id: "f1",
    year: "2018",
    tag: "GENESIS",
    title: "The Spark of Innovation",
    description:
      "Founded the IEDC with a vision to nurture student entrepreneurship and foster a culture of research and deep-tech innovation on campus.",
    details: [
      "Established core mentoring board with senior industry leaders and alumni.",
      "Opened the first dedicated co-working space and electronics prototyping lab.",
      "Hosted the inaugural bootcamp with 500+ student attendees.",
    ],
    iconName: "Sparkles",
    orderRank: 1,
  },
  {
    _id: "f2",
    year: "2020",
    tag: "INCUBATION",
    title: "Incubation Program Launch",
    description:
      "Launched our first cohort of student-led startups. Secured seed funding partners to turn academic projects into viable commercial products.",
    details: [
      "Incubated 12 deep-tech student startups in the IoT and AI sectors.",
      "Secured ₹50 Lakhs in seed support from government and venture partners.",
      "Established legal advisory support for intellectual property and patent filing.",
    ],
    iconName: "Rocket",
    orderRank: 2,
  },
  {
    _id: "f3",
    year: "2022",
    tag: "GROWTH",
    title: "Patent & Innovation Surge",
    description:
      "Surpassed 20+ patents filed and signed global research partnerships. Recognized as a model incubation cell by regional development bodies.",
    details: [
      "Supported research teams in filing 22+ novel utility patents.",
      "Exited 3 student startups with successful follow-on investment.",
      "Signed research partnership agreements with 5 international technology institutes.",
    ],
    iconName: "Award",
    orderRank: 3,
  },
  {
    _id: "f4",
    year: "2024",
    tag: "FRONTIER",
    title: "Quantum & Advanced AI Lab",
    description:
      "Established state-of-the-art labs for Frontier Computing and Neural Horizons. Received national grants for pioneering deep-tech research.",
    details: [
      "Opened a 3,000 sq ft Quantum Computing & Neural Horizons research facility.",
      "Received ₹2 Crore national-level grant for deep-tech R&D programs.",
      "Launched cross-disciplinary fellowship programs in quantum-AI convergence.",
    ],
    iconName: "Cpu",
    orderRank: 4,
  },
  {
    _id: "f5",
    year: "2026",
    tag: "GLOBAL",
    title: "International Expansion",
    description:
      "Expanding our innovation network across borders, building a global ecosystem connecting student innovators worldwide with industry mentors.",
    details: [
      "Launched global student exchange program across 10+ partner universities.",
      "Hosted first international deep-tech innovation summit with 2000+ participants.",
      "Deployed open-source research platform used by 50+ institutions worldwide.",
    ],
    iconName: "Globe",
    orderRank: 5,
  },
];

interface MilestoneCardProps {
  milestone: MilestoneData;
  index: number;
}

function MilestoneCard({ milestone, index }: MilestoneCardProps) {
  const Icon = ICON_MAP[milestone.iconName] ?? Sparkles;
  return (
    <div
      className={`journey-card-${index} relative bg-card/40 dark:bg-zinc-900/30 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary/40 dark:hover:border-primary/30 hover:-translate-y-1 group overflow-hidden`}
    >
      {/* Huge subtle year indicator in background */}
      <span className="absolute right-6 top-6 text-7xl md:text-8xl font-black font-mono text-zinc-200/30 dark:text-zinc-800/10 select-none pointer-events-none group-hover:text-primary/10 transition-colors duration-500">
        {milestone.year}
      </span>

      {/* Card header */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500">
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-mono text-xs tracking-[0.25em] text-primary font-bold uppercase">
            {milestone.tag}
          </span>
          <h3 className="text-xl md:text-2xl font-bold font-['Syne'] leading-tight text-foreground mt-0.5">
            {milestone.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 relative z-10">
        {milestone.description}
      </p>

      {/* Divider */}
      <hr className="border-zinc-200/60 dark:border-zinc-800/60 my-4" />

      {/* Details List */}
      <ul className="space-y-3 text-sm text-muted-foreground relative z-10">
        {milestone.details.map((detail, dIdx) => (
          <li key={dIdx} className="flex items-start gap-3">
            <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
            <span className="leading-relaxed">{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface OurJourneyProps {
  milestones?: MilestoneData[] | null;
}

export default function OurJourney({ milestones: propMilestones }: OurJourneyProps) {
  const milestones =
    propMilestones && propMilestones.length > 0 ? propMilestones : FALLBACK_MILESTONES;

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const activeLine = activeLineRef.current;
    if (!container || !activeLine) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        activeLine,
        { height: "0%" },
        {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top 25%",
            end: "bottom 75%",
            scrub: 0.5,
          },
        }
      );

      milestones.forEach((_, idx) => {
        const isEven = idx % 2 === 0;
        gsap.fromTo(
          `.journey-card-${idx}`,
          { opacity: 0, x: isEven ? -45 : 45, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: `.journey-card-${idx}`,
              start: "top 85%",
              end: "top 60%",
              scrub: 0.5,
            },
          }
        );

        ScrollTrigger.create({
          trigger: `.journey-card-${idx}`,
          start: "top 72%",
          end: "bottom 20%",
          toggleClass: {
            targets: [`#node-${idx}`, `#node-icon-${idx}`],
            className: "node-active",
          },
        });
      });
    }, container);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [milestones]);

  return (
    <section
      ref={containerRef}
      className="relative w-full py-20 md:py-32 overflow-hidden bg-background text-foreground transition-colors duration-300"
    >
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Section Title */}
      <div className="text-center mb-20 md:mb-28 px-4 relative z-10">
        <p className="text-primary font-mono text-xs md:text-sm tracking-[0.3em] uppercase mb-3 font-semibold">
          Timeline
        </p>
        <h2 className="text-4xl md:text-6xl font-bold font-['Syne'] tracking-tight">
          Our Journey
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
          From a small idea to a thriving innovation ecosystem — every milestone tells a story.
        </p>
      </div>

      {/* Timeline Layout */}
      <div className="relative w-full max-w-6xl mx-auto px-4">
        <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800/80 z-0">
          {/* Active Progress Line */}
          <div
            ref={activeLineRef}
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary/30 via-primary to-primary origin-top shadow-[0_0_10px_var(--primary)]"
            style={{ height: "0%" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
              <div className="w-6 h-6 bg-primary rounded-full animate-ping absolute inset-0 opacity-40" />
              <div className="relative w-5 h-5 bg-primary rounded-full border-2 border-background shadow-[0_0_12px_var(--primary)] flex items-center justify-center">
                <div className="w-2 h-2 bg-background rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-16 md:space-y-24">
          {milestones.map((milestone, idx) => {
            const isEven = idx % 2 === 0;
            const Icon = ICON_MAP[milestone.iconName] ?? Sparkles;

            return (
              <div
                key={milestone._id}
                className="relative grid grid-cols-1 md:grid-cols-9 gap-4 md:gap-8 items-center pl-16 md:pl-0"
              >
                <div className="absolute left-8 -translate-x-1/2 top-6 md:relative md:left-auto md:translate-x-0 md:top-auto md:col-span-1 md:col-start-5 flex justify-center z-10">
                  <div
                    id={`node-${idx}`}
                    className="journey-node w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md transition-all duration-500 [&.node-active]:bg-primary [&.node-active]:border-primary [&.node-active]:scale-110 [&.node-active]:shadow-[0_0_15px_var(--primary)]"
                  >
                    <Icon
                      id={`node-icon-${idx}`}
                      className="w-5 h-5 text-muted-foreground transition-colors duration-500 [&.node-active]:text-primary-foreground"
                      strokeWidth={2}
                    />
                  </div>
                </div>

                <div
                  className={`md:col-span-4 ${isEven ? "md:col-start-1" : "md:col-start-6"}`}
                >
                  <MilestoneCard milestone={milestone} index={idx} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

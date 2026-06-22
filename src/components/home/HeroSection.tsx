"use client";

import type { HomePageData } from "../../../sanity/lib/queries";
import { urlFor } from "../../../sanity/lib/image";

// ─── Fallback defaults ────────────────────────────────────────────────────────
const FALLBACK: HomePageData = {
  heroBackground: null,
  heroHeading: "Innovation & Entrepreneurship Development Cell",
  heroDepartment: "Computer Science and Engineering",
  heroSpecialisations: ["Internet of Things", "Cyber Security", "Blockchain Technology"],
  heroPrimaryCtaLabel: "Explore Programs →",
  heroSecondaryCtaLabel: "Meet the Team",
  heroTagline: "Innovate · Build · Disrupt",
  aboutEyebrow: "◆ Who We Are ◆",
  aboutHeading: "Crafting stories that resonate.",
  aboutBody: "",
  aboutCtaLabel: "Explore More",
};

const HIGHLIGHTS = [
  { icon: "🏆", text: "Best Innovation Lab — 2024" },
  { icon: "🌐", text: "100+ Global Partners" },
  { icon: "📄", text: "500+ Research Publications" },
  { icon: "🚀", text: "Pioneering since 1999" },
  { icon: "🎓", text: "300+ PhD Graduates" },
  { icon: "💡", text: "$10M+ Research Grants" },
];

function splitHeading(heading: string): { before: string; after: string } {
  const idx = heading.indexOf("&");
  if (idx === -1) return { before: heading, after: "" };
  return {
    before: heading.slice(0, idx + 1).trim(),
    after: heading.slice(idx + 1).trim(),
  };
}

interface HeroSectionProps {
  data?: HomePageData | null;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const d = data ?? FALLBACK;

  const bgUrl = d.heroBackground
    ? urlFor(d.heroBackground).width(1920).quality(85).url()
    : "";

  const { before: headLine1, after: headLine2 } = splitHeading(d.heroHeading);
  const [, ...deptRest] = d.heroDepartment.split(" of ");
  const deptSuffix = deptRest.join(" of ");

  return (
    <div
      className="relative w-full select-none overflow-x-clip bg-center bg-cover bg-no-repeat bg-background font-sans transition-colors duration-300"
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      {/* ── Overlays ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(to_right,var(--background)_0%,oklch(from_var(--background)_l_c_h/0.95)_20%,oklch(from_var(--background)_l_c_h/0.65)_40%,oklch(from_var(--background)_l_c_h/0.1)_80%)]" />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(to_top,var(--background)_0%,oklch(from_var(--background)_l_c_h/0.45)_20%,oklch(from_var(--background)_l_c_h/0.15)_40%,transparent_80%)]" />
      <div className="absolute inset-0 z-[2] pointer-events-none bg-[linear-gradient(to_bottom,var(--background)_0%,oklch(from_var(--background)_l_c_h/0.6)_8%,transparent_30%)]" />

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex flex-row w-full">

        {/* ── LEFT / CENTER ── */}
        <div className="flex-1 flex flex-col px-[4vw] pt-2 min-w-0 gap-0">

         
          {/* ── PRIMARY HEADING ── */}
          <h1 className="font-['Bebas_Neue'] font-normal leading-[0.92] tracking-[0.01em] text-foreground mb-5 text-[clamp(2.4rem,8vw,7.5rem)]">
            {headLine1}
            <br />
            {headLine2 && (
              <>
                {headLine2.split(" ").slice(0, -2).join(" ")}
                <br />
                <span className="text-primary">
                  {headLine2.split(" ").slice(-2).join(" ")}
                </span>
              </>
            )}
          </h1>

          {/* Acronym + line */}
          <div className="flex items-center gap-3.5 mb-5">
            <span className="font-mono text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-background bg-primary px-4 py-1 tracking-[0.22em] rounded">
              I.E.D.C
            </span>
            <div className="h-px flex-1 max-w-[160px] bg-gradient-to-r from-primary to-transparent" />
          </div>

          {/* Department */}
          <h2 className="font-['Bebas_Neue'] text-lg sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-none tracking-[0.015em] text-foreground/75 mb-5">
            {deptSuffix ? (
              <>
                <span className="hidden md:inline">Department of </span>
                {deptSuffix}
              </>
            ) : (
              d.heroDepartment
            )}
          </h2>

          {/* Mission blurb */}
          <p className="text-sm sm:text-base text-foreground/55 leading-relaxed max-w-xl mb-6 font-['Space_Grotesk']">
            A premier research and innovation hub empowering students, faculty, and industry
            partners to co-create breakthrough technologies — from IoT and AI to quantum
            computing and space systems.
          </p>

          {/* Specialisations */}
          <div className="flex flex-wrap gap-2 mb-7">
            {d.heroSpecialisations.map((s) => (
              <span
                key={s}
                className="font-mono text-[9px] sm:text-[10px] tracking-[0.06em] uppercase text-primary border border-primary/35 bg-primary/5 px-3 py-1 rounded"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap mb-10">
            <button className="px-7 py-2.5 rounded text-[11px] font-bold tracking-[0.08em] text-background bg-gradient-to-br from-primary to-[#a8d62a] shadow-lg shadow-primary/30 uppercase cursor-pointer hover:opacity-90 transition-all">
              {d.heroPrimaryCtaLabel}
            </button>
            <button className="px-7 py-2.5 rounded text-[11px] font-bold tracking-[0.08em] text-primary border border-primary/45 bg-transparent uppercase cursor-pointer hover:bg-primary/8 transition-all">
              {d.heroSecondaryCtaLabel}
            </button>
          </div>

    
        </div>

        {/* ── RIGHT — Vertical tagline strip ── */}
        <div className="hidden md:flex w-14 shrink-0 flex-col items-center justify-center border-l border-primary/20 py-10 gap-8 relative self-stretch">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none" />
          <div className="[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 font-mono text-[11px] tracking-[0.35em] uppercase text-primary/80 select-none font-extrabold">
            {d.heroTagline}
          </div>
        </div>
      </div>

      </div>
  );
}

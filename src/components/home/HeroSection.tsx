"use client";

import type { HomePageData } from "../../../sanity/lib/queries";
import { urlFor } from "../../../sanity/lib/image";

// ─── Fallback defaults (used when Sanity has no content yet) ──────────────────
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

// Split "Innovation & Entrepreneurship Development Cell" into two lines at the "&"
function splitHeading(heading: string): { before: string; after: string } {
  const idx = heading.indexOf("&");
  if (idx === -1) return { before: heading, after: "" };
  return {
    before: heading.slice(0, idx + 1).trim(), // "Innovation &"
    after: heading.slice(idx + 1).trim(),      // "Entrepreneurship Development Cell"
  };
}

interface HeroSectionProps {
  data?: HomePageData | null;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const d = data ?? FALLBACK;

  // Build background image URL from Sanity, or fall back to the original Cloudinary URL
  const bgUrl = d.heroBackground
    ? urlFor(d.heroBackground).width(1920).quality(85).url()
    : "https://res.cloudinary.com/dvky83edw/image/upload/v1774103669/iot/e7aa4373-5920-499d-af38-7d109e14ecef.png";

  const { before: headLine1, after: headLine2 } = splitHeading(d.heroHeading);
  const [deptPrefix, ...deptRest] = d.heroDepartment.split(" of ");
  const deptSuffix = deptRest.join(" of ");

  return (
    <div
      className="relative z-2 min-h-screen w-full select-none overflow-x-clip overflow-y-visible bg-center bg-cover bg-no-repeat bg-background font-sans [perspective:1400px] [perspective-origin:50%_100%] transition-colors duration-300"
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      {/* ── Left to Right Overlay ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(to_right,var(--background)_0%,oklch(from_var(--background)_l_c_h_/_0.95)_30%,oklch(from_var(--background)_l_c_h_/_0.65)_60%,oklch(from_var(--background)_l_c_h_/_0.1)_100%)]"
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(to_top,var(--background)_0%,oklch(from_var(--background)_l_c_h_/_0.45)_30%,oklch(from_var(--background)_l_c_h_/_0.15)_60%,transparent_100%)]"
      />
      <div
        className="absolute inset-x-0 bottom-[-14rem] top-0 z-[4] pointer-events-none bg-[linear-gradient(to_bottom,transparent_0%,oklch(from_var(--background)_l_c_h/0.1)_20%,oklch(from_var(--background)_l_c_h/0.25)_40%,oklch(from_var(--background)_l_c_h/0.5)_60%,oklch(from_var(--background)_l_c_h/0.75)_80%,var(--background)_100%)]"
      />

      {/* ── MAIN CONTENT — sits above scrim ── */}
      <div className="relative z-10 flex flex-row w-full min-h-screen items-stretch">
        {/* ── LEFT / CENTER — Institution name block ── */}
        <div className="flex-1 flex flex-col justify-start pt-12 min-h-screen px-[6vw] min-w-0">
          {/* ── PRIMARY GIANT HEADING ── */}
          <h1
            className="font-['Bebas_Neue'] font-normal leading-[0.95] tracking-[0.01em] text-foreground margin-0 mb-1 text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
          >
            {headLine1}
            <br />
            {headLine2 && (
              <>
                {/* Show last two words in primary colour */}
                {headLine2.split(" ").slice(0, -2).join(" ")}{" "}
                <span className="text-primary">
                  {headLine2.split(" ").slice(-2).join(" ")}
                </span>
              </>
            )}
          </h1>

          {/* Acronym badge */}
          <div className="flex items-center gap-3.5 mb-3">
            <span className="font-mono text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-background bg-primary px-5 py-1 tracking-[0.25em] rounded">
              I.E.D.C
            </span>
            <div className="h-0.5 flex-1 max-w-[120px] bg-gradient-to-r from-primary to-transparent" />
          </div>

          {/* Horizontal rule */}
          <div className="h-px w-[70%] bg-gradient-to-r from-primary/40 to-transparent mb-2.5" />

          {/* ── DEPARTMENT NAME ── */}
          <h2 className="font-['Bebas_Neue'] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-none tracking-[0.015em] text-foreground/80 margin-0 mb-2.5">
            {deptSuffix ? (
              <>
                <span className="hidden md:block">Department of</span>
                {deptSuffix}
              </>
            ) : (
              d.heroDepartment
            )}
          </h2>

          {/* Specialisations */}
          <div className="flex flex-wrap gap-2 mb-4">
            {d.heroSpecialisations.map((s) => (
              <span
                key={s}
                className="font-mono text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.06em] uppercase text-primary border border-primary/35 bg-primary/5 px-3.5 py-1.25 rounded"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap">
            <button className="px-8 py-2.5 rounded text-[10px] font-bold tracking-[0.06em] text-background bg-gradient-to-br from-primary to-[#a8d62a] shadow-lg shadow-primary/35 uppercase cursor-pointer hover:opacity-90 transition-all">
              {d.heroPrimaryCtaLabel}
            </button>
            <button className="px-8 py-2.5 rounded text-[10px] font-bold tracking-[0.06em] text-primary border border-primary/45 bg-transparent uppercase cursor-pointer hover:bg-primary/5 transition-all">
              {d.heroSecondaryCtaLabel}
            </button>
          </div>

          {/* Mobile tagline */}
          <div className="mt-6 flex items-center gap-3 md:hidden max-w-[420px]">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary/90 select-none whitespace-nowrap font-extrabold">
              {d.heroTagline}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
          </div>
        </div>

        {/* ── RIGHT — Vertical tagline strip ── */}
        <div className="hidden md:flex w-14 shrink-0 flex-col items-center justify-center border-l border-border/40 py-10 gap-8 relative">
          {/* Vertical scrolling indicator line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none" />

          {/* Vertical text — tagline */}
          <div className="[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 font-mono text-[12px] tracking-[0.35em] uppercase text-primary/90 select-none font-extrabold">
            {d.heroTagline}
          </div>
        </div>
      </div>
    </div>
  );
}

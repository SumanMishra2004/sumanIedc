"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("twitter") || p.includes("x")) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.018 2.25H8.08l4.259 5.629 5.905-5.629Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p.includes("linkedin")) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (p.includes("github")) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }
  if (p.includes("youtube")) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
};

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: "About", href: "#" },
  { label: "Research", href: "#" },
  { label: "Publications", href: "#" },
  { label: "Faculty", href: "#" },
  { label: "Gallery", href: "#" },
  { label: "Contact", href: "#" },
];

const SOCIALS = [
  {
    label: "Twitter / X",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.018 2.25H8.08l4.259 5.629 5.905-5.629Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

const CONTACT_ITEMS = [
  {
    label: "Address",
    value: "Innovation Block, Research Park, Kolkata 700 001",
  },
  { label: "Email", value: "contact@iedc.edu.in" },
  { label: "Phone", value: "+91 98765 43210" },
];

export default function Footer({ data, contactData }: { data?: any; contactData?: any }) {
  const footerRef = useRef<HTMLElement>(null);
  const bigTextRef = useRef<HTMLDivElement>(null);
  const topLineRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [localData, setLocalData] = useState<any>(null);

  useEffect(() => {
    if (!data) {
      fetch("/api/public/layout-settings")
        .then((res) => res.json())
        .then((resData) => {
          if (resData?.footer) {
            setLocalData(resData.footer);
          }
        })
        .catch((err) => console.error("Error loading footer layout settings:", err));
    }
  }, [data]);

  const wordmark = data?.footerWordmark || localData?.wordmark || ["IEDC", "Research", "Lab"];
  const aboutText = data?.footerAbout || localData?.about || "A multidisciplinary research lab at the frontier of computing, AI, and life sciences — shaping tomorrow through rigorous inquiry and bold collaboration.";
  const navLinks = data?.footerLinks || localData?.links || NAV_LINKS;

  const contactAddress = data?.footerAddress || localData?.contact?.address || contactData?.location || "Innovation Block, Research Park, Kolkata 700 001";
  const contactEmail = data?.footerEmail || localData?.contact?.email || contactData?.emails?.[0] || "contact@iedc.edu.in";
  const contactPhone = data?.footerPhone || localData?.contact?.phone || contactData?.phones?.[0]?.number || "+91 98765 43210";

  const contactItems = [
    { label: "Address", value: contactAddress },
    { label: "Email", value: contactEmail },
    { label: "Phone", value: contactPhone },
  ];

  const socials = (data?.footerSocials || localData?.socials)
    ? (data?.footerSocials || localData?.socials).map((s: any) => ({
        label: s.platform,
        href: s.url,
        icon: getSocialIcon(s.platform),
      }))
    : SOCIALS;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Top divider line
      gsap.fromTo(
        topLineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "expo.inOut",
          scrollTrigger: { trigger: topLineRef.current, start: "top 92%" },
        },
      );

      // Giant logo text — horizontal slide + fade words
      if (bigTextRef.current) {
        const words = bigTextRef.current.querySelectorAll(".ft-word");
        gsap.fromTo(
          words,
          { y: "105%", opacity: 0 },
          {
            y: "0%",
            opacity: 1,
            stagger: 0.07,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: bigTextRef.current, start: "top 88%" },
          },
        );
      }

      // Grid columns — stagger up
      if (gridRef.current) {
        const cols = gridRef.current.querySelectorAll(".ft-col");
        gsap.fromTo(
          cols,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: gridRef.current, start: "top 88%" },
          },
        );
      }

      // Bottom bar
      gsap.fromTo(
        bottomRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: bottomRef.current, start: "top 95%" },
        },
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-background text-foreground font-['Syne'] overflow-hidden transition-colors duration-300"
    >
      {/* Top blend seam */}
      <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[repeating-linear-gradient(0deg,var(--border)_0,var(--border)_1px,transparent_1px,transparent_44px),repeating-linear-gradient(90deg,var(--border)_0,var(--border)_1px,transparent_1px,transparent_44px)]" />

      {/* Accent glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[70vw] h-[40vh] pointer-events-none bg-[radial-gradient(ellipse,rgba(201,245,59,0.055)_0%,transparent_70%)]" />
      {/* Additional ambient blobs */}
      <div className="absolute top-[10%] left-[-5%] w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.07)_0%,transparent_65%)] pointer-events-none blur-[2px]" />
      <div className="absolute top-[20%] right-[-5%] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.07)_0%,transparent_65%)] pointer-events-none blur-[2px]" />
      <div className="absolute bottom-[35%] left-[25%] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(201,245,59,0.05)_0%,transparent_65%)] pointer-events-none blur-[2px]" />

      <div className="relative z-10 px-[6vw]">
        {/* ── Top divider ── */}
        <div
          ref={topLineRef}
          className="h-px bg-gradient-to-r from-transparent via-primary to-border/30 origin-left mb-[72px] mt-[80px]"
        />

        {/* ── Giant wordmark ── */}
        <div
          ref={bigTextRef}
          className="overflow-hidden mb-20 leading-[0.9]"
        >
          {wordmark.map((word: string, i: number) => (
            <div key={i} className="overflow-hidden block">
              <span
                className={`ft-word inline-block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-[-0.04em] opacity-0 will-change-transform ${
                  i === wordmark.length - 1
                    ? "text-primary"
                    : i === 1
                      ? "text-foreground/55 italic"
                      : "text-foreground"
                }`}
              >
                {word}
              </span>
            </div>
          ))}
        </div>

        {/* ── Columns grid ── */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12 mb-[72px]"
        >
          {/* About col */}
          <div className="ft-col opacity-0">
            <p className="text-[10px] tracking-[0.38em] uppercase text-primary font-mono mb-4">
              About Us
            </p>
            <p className="text-sm text-foreground/55 leading-relaxed">
              {aboutText}
            </p>
          </div>

          {/* Links col */}
          <div className="ft-col opacity-0">
            <p className="text-[10px] tracking-[0.38em] uppercase text-primary font-mono mb-4">
              Navigate
            </p>
            <nav className="flex flex-col gap-2.5">
              {navLinks.map((link: any) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-foreground/45 hover:text-primary hover:translate-x-1.5 transition-all duration-200 ease-out font-mono tracking-wide inline-block"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact col */}
          <div className="ft-col opacity-0">
            <p className="text-[10px] tracking-[0.38em] uppercase text-primary font-mono mb-4">
              Contact
            </p>
            <div className="flex flex-col gap-3.5">
              {contactItems.map((item: any) => (
                <div key={item.label}>
                  <p className="text-[9px] tracking-[0.25em] uppercase text-foreground/35 font-mono mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm text-foreground/65 leading-normal">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Social col */}
          <div className="ft-col opacity-0">
            <p className="text-[10px] tracking-[0.38em] uppercase text-primary font-mono mb-4">
              Follow
            </p>
            <div className="flex flex-col gap-3.5">
              {socials.map((s: any) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex items-center gap-[10px] text-sm text-foreground/45 hover:text-primary hover:translate-x-1.5 transition-all duration-200 ease-out font-mono tracking-wide"
                >
                  {s.icon}
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          ref={bottomRef}
          className="opacity-0 border-t border-border/40 py-6 flex items-center justify-between flex-wrap gap-3"
        >
          <p className="text-[11px] text-foreground/35 font-mono tracking-wider">
            © {new Date().getFullYear()} IEDC Research Lab. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Use", "Sitemap"].map((t) => (
              <a
                key={t}
                href="#"
                className="text-[11px] text-foreground/35 hover:text-primary transition-colors duration-200 font-mono tracking-wider"
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}


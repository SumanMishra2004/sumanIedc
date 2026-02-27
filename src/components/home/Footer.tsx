"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const bigTextRef = useRef<HTMLDivElement>(null);
  const topLineRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Magnetic hover for social icons
  const onSocialEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.15,
      color: "#c9f53b",
      duration: 0.25,
      ease: "power2.out",
    });
  };
  const onSocialLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      color: "rgba(240,237,230,0.45)",
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const onLinkEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      x: 6,
      color: "#c9f53b",
      duration: 0.2,
      ease: "power2.out",
    });
  };
  const onLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      color: "rgba(240,237,230,0.45)",
      duration: 0.2,
      ease: "power2.out",
    });
  };

  return (
    <footer
      ref={footerRef}
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#0c0c0c",
        color: "#f0ede6",
        fontFamily: "'Syne', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top blend seam */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          background:
            "linear-gradient(to bottom, #0c0c0c 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Subtle grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 44px)",
        }}
      />

      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70vw",
          height: "40vh",
          background:
            "radial-gradient(ellipse, rgba(201,245,59,0.055) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Additional ambient blobs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-5%",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "-5%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(219,39,119,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          left: "25%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,245,59,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(2px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, padding: "0 6vw" }}>
        {/* ── Top divider ── */}
        <div
          ref={topLineRef}
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #c9f53b 40%, rgba(255,255,255,0.12) 100%)",
            transformOrigin: "left",
            marginBottom: 72,
            marginTop: 80,
          }}
        />

        {/* ── Giant wordmark ── */}
        <div
          ref={bigTextRef}
          style={{ overflow: "hidden", marginBottom: 80, lineHeight: 0.9 }}
        >
          {["IEDC", "Research", "Lab"].map((word, i) => (
            <div key={i} style={{ overflow: "hidden", display: "block" }}>
              <span
                className="ft-word"
                style={{
                  display: "inline-block",
                  fontSize: "clamp(2.7rem, 10vw, 9rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color:
                    i === 2
                      ? "#c9f53b"
                      : i === 1
                        ? "rgba(240,237,230,0.55)"
                        : "#f0ede6",
                  fontStyle: i === 1 ? "italic" : "normal",
                  opacity: 0,
                  willChange: "transform",
                }}
              >
                {word}
              </span>
            </div>
          ))}
        </div>

        {/* ── Columns grid ── */}
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "48px 40px",
            marginBottom: 72,
          }}
        >
          {/* About col */}
          <div className="ft-col" style={{ opacity: 0 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#c9f53b",
                fontFamily: "monospace",
                marginBottom: 16,
              }}
            >
              About Us
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(240,237,230,0.45)",
                lineHeight: 1.8,
              }}
            >
              A multidisciplinary research lab at the frontier of computing, AI,
              and life sciences — shaping tomorrow through rigorous inquiry and
              bold collaboration.
            </p>
          </div>

          {/* Links col */}
          <div className="ft-col" style={{ opacity: 0 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#c9f53b",
                fontFamily: "monospace",
                marginBottom: 16,
              }}
            >
              Navigate
            </p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onMouseEnter={onLinkEnter}
                  onMouseLeave={onLinkLeave}
                  style={{
                    fontSize: 14,
                    color: "rgba(240,237,230,0.45)",
                    textDecoration: "none",
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                    willChange: "transform",
                    display: "inline-block",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact col */}
          <div className="ft-col" style={{ opacity: 0 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#c9f53b",
                fontFamily: "monospace",
                marginBottom: 16,
              }}
            >
              Contact
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {CONTACT_ITEMS.map((item) => (
                <div key={item.label}>
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "rgba(240,237,230,0.25)",
                      fontFamily: "monospace",
                      marginBottom: 3,
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(240,237,230,0.55)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Social col */}
          <div className="ft-col" style={{ opacity: 0 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#c9f53b",
                fontFamily: "monospace",
                marginBottom: 16,
              }}
            >
              Follow
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  onMouseEnter={onSocialEnter}
                  onMouseLeave={onSocialLeave}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "rgba(240,237,230,0.45)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                    willChange: "transform",
                  }}
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
          style={{
            opacity: 0,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingBlock: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(240,237,230,0.25)",
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            © {new Date().getFullYear()} IEDC Research Lab. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms of Use", "Sitemap"].map((t) => (
              <a
                key={t}
                href="#"
                style={{
                  fontSize: 11,
                  color: "rgba(240,237,230,0.25)",
                  fontFamily: "monospace",
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  gsap.to(e.currentTarget, { color: "#c9f53b", duration: 0.2 })
                }
                onMouseLeave={(e) =>
                  gsap.to(e.currentTarget, {
                    color: "rgba(240,237,230,0.25)",
                    duration: 0.2,
                  })
                }
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');`}</style>
    </footer>
  );
}

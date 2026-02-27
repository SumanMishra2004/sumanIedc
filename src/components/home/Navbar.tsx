"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import gsap from "gsap";

const ALL_LINKS = [
  { label: "Home",         href: "#home" },
  { label: "About Us",     href: "#about" },
  { label: "Courses",      href: "#courses" },
  { label: "Research",     href: "#research" },
  { label: "Achievements", href: "#achievements" },
  { label: "Gallery",      href: "#gallery" },
  { label: "Team",         href: "#team" },
  { label: "Contact",      href: "#contact" },
];

// Desktop nav link
function NavLink({
  href,
  label,
  withSep = false,
  onClick,
}: {
  href: string;
  label: string;
  withSep?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative group shrink-0 px-3 py-2.5 text-[12px] lg:text-[13px] font-medium text-white/55 hover:text-[#c9f53b] transition-colors duration-200 select-none"
      style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", letterSpacing: "0.05em" }}
    >
      {label}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-[#c9f53b] rounded-full transition-all duration-300 group-hover:w-4/5" />
      {withSep && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 bg-white/10 pointer-events-none" />
      )}
    </Link>
  );
}

// Placeholder logo (swap with <Image> once you have real logos)
function LogoPlaceholder({ label, size = 56 }: { label: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-[#c9f53b]/60 bg-[#c9f53b]/10 font-bold text-[#c9f53b] select-none shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.28, fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {label}
    </div>
  );
}

// Avatar + dropdown for authenticated users
function UserMenu({ name, email, image }: { name?: string | null; email?: string | null; image?: string | null }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (name ?? email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={dropRef} className="relative shrink-0">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 focus:outline-none group"
        aria-label="User menu"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name ?? "User"}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-[#c9f53b]/50 group-hover:ring-[#c9f53b] transition-all duration-200"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-[#c9f53b]/50 group-hover:ring-[#c9f53b] transition-all duration-200 text-[11px] font-bold"
            style={{ background: "rgba(201,245,59,0.15)", color: "#c9f53b", fontFamily: "'Space Grotesk',sans-serif" }}
          >
            {initials}
          </div>
        )}
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="rgba(201,245,59,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
          style={{
            background: "rgba(12,12,12,0.97)",
            border: "1px solid rgba(201,245,59,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(201,245,59,0.08)" }}>
            <p className="text-[12px] font-semibold text-white/90 truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              {name ?? "User"}
            </p>
            {email && (
              <p className="text-[10px] text-white/40 truncate mt-0.5" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                {email}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-[#c9f53b] hover:bg-[#c9f53b]/5 transition-all duration-150"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </Link>

            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hamburger / Close icon
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-4 flex flex-col justify-between">
      <span
        className="block h-0.5 bg-[#c9f53b] rounded-full transition-all duration-300 origin-center"
        style={{ transform: open ? "translateY(7px) rotate(45deg)" : "none" }}
      />
      <span
        className="block h-0.5 bg-[#c9f53b] rounded-full transition-all duration-300"
        style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "none" }}
      />
      <span
        className="block h-0.5 bg-[#c9f53b] rounded-full transition-all duration-300 origin-center"
        style={{ transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }}
      />
    </div>
  );
}

export default function Navbar() {
  const topRowRef   = useRef<HTMLDivElement>(null);
  const navbarRef   = useRef<HTMLElement>(null);
  const isCollapsed = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Scroll-collapse logo strip
  useEffect(() => {
    const navbar = navbarRef.current;
    const topRow = topRowRef.current;
    if (!navbar || !topRow) return;

    const topHeight        = topRow.scrollHeight;
    const SCROLL_THRESHOLD = 80;

    const onScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > SCROLL_THRESHOLD);

      if (scrollY > SCROLL_THRESHOLD && !isCollapsed.current) {
        isCollapsed.current = true;
        gsap.to(topRow, {
          height: 0,
          opacity: 0,
          paddingTop: 0,
          paddingBottom: 0,
          duration: 0.45,
          ease: "power3.inOut",
          onComplete: () => { topRow.style.overflow = "hidden"; },
        });
        gsap.to(navbar, {
          backdropFilter: "blur(20px)",
          boxShadow: "0 2px 32px 0 rgba(201,245,59,0.08)",
          duration: 0.3,
        });
      } else if (scrollY <= SCROLL_THRESHOLD && isCollapsed.current) {
        isCollapsed.current = false;
        topRow.style.overflow = "";
        gsap.to(topRow, {
          height: topHeight,
          opacity: 1,
          paddingTop: "0.75rem",
          paddingBottom: "0.75rem",
          duration: 0.45,
          ease: "power3.inOut",
        });
        gsap.to(navbar, { boxShadow: "none", duration: 0.3 });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`}</style>

      <header
        ref={navbarRef}
        className="fixed top-0 left-0 right-0 z-[100] w-full"
        style={{
          background: "linear-gradient(180deg,rgba(12,12,12,0.98) 0%,rgba(12,12,12,0.92) 100%)",
          borderBottom: "1px solid rgba(201,245,59,0.12)",
        }}
      >
        {/* ── ROW 1 · Logo strip ── */}
        <div
          ref={topRowRef}
          className="w-full py-3 overflow-hidden"
          style={{ willChange: "height, opacity" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">

            {/* LEFT LOGO – hidden on xs, shown sm+ */}
            <div className="hidden sm:flex shrink-0 items-center gap-2 lg:gap-3">
              {/* swap LogoPlaceholder with <Image src="/logos/left.png" …> */}
              <LogoPlaceholder label="L" size={48} />
              <div className="hidden lg:flex flex-col">
                <span className="text-[10px] font-semibold text-[#c9f53b]/80 uppercase tracking-widest leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  Institute
                </span>
                <span className="text-[9px] text-white/50 leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  Your University Name
                </span>
              </div>
            </div>

            {/* CENTER LOGO + title */}
            <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
              {/* swap LogoPlaceholder with <Image src="/logos/center.png" …> */}
              <LogoPlaceholder label="IEDC" size={52} />
              <div className="flex flex-col items-start min-w-0">
                <span
                  className="text-[11px] sm:text-[13px] lg:text-[14.5px] font-bold leading-snug truncate"
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    letterSpacing: "0.03em",
                    background: "linear-gradient(90deg,#c9f53b 0%,#a8e63b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Innovation &amp; Entrepreneurship Development Cell
                </span>
                <span
                  className="hidden sm:block text-[9.5px] lg:text-[10.5px] text-white/55 leading-snug mt-0.5"
                  style={{ fontFamily: "'Space Grotesk',sans-serif" }}
                >
                  Dept. of Computer Science &amp; Engineering
                  <span className="hidden lg:inline"> · <span className="text-[#c9f53b]/65">IoT, Cyber Security &amp; Blockchain</span></span>
                </span>
              </div>
            </div>

            {/* RIGHT LOGO – hidden on xs, shown sm+ */}
            <div className="hidden sm:flex shrink-0 items-center gap-2 lg:gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-semibold text-[#c9f53b]/80 uppercase tracking-widest leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  Partner
                </span>
                <span className="text-[9px] text-white/50 leading-tight text-right" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  Your Partner Name
                </span>
              </div>
              {/* swap LogoPlaceholder with <Image src="/logos/right.png" …> */}
              <LogoPlaceholder label="R" size={48} />
            </div>

          </div>
        </div>

        {/* Lime gradient divider */}
        <div
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(90deg,transparent 0%,rgba(201,245,59,0.35) 30%,rgba(201,245,59,0.6) 50%,rgba(201,245,59,0.35) 70%,transparent 100%)",
          }}
        />

        {/* ── ROW 2 · Navigation bar ── */}
        <div className="w-full" style={{ background: "rgba(10,10,10,0.96)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center h-11">

            {/* Desktop nav – hidden on mobile */}
            <nav className="hidden md:flex flex-1 items-center">
              {/* Home on the left */}
              <NavLink href="#home" label="Home" />
              {/* Separator */}
              <span className="w-px h-3 bg-white/10 mx-1" />
              {/* Rest centered */}
              <div className="flex-1 flex items-center justify-center">
                {ALL_LINKS.slice(1).map((link, i) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    withSep={i < ALL_LINKS.length - 2}
                  />
                ))}
              </div>
            </nav>

            {/* Mobile: logo name shorthand + spacer */}
            <div className="flex md:hidden flex-1 items-center">
              <span
                className="text-[13px] font-bold"
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  background: "linear-gradient(90deg,#c9f53b 0%,#a8e63b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                I.E.D.C
              </span>
            </div>

            {/* Auth area – desktop */}
            <div className="shrink-0 pl-3 hidden md:flex items-center">
              {status === "loading" ? (
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
              ) : isAuthed ? (
                <UserMenu
                  name={session.user?.name}
                  email={session.user?.email}
                  image={session.user?.image}
                />
              ) : (
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-full transition-all duration-200"
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    letterSpacing: "0.05em",
                    border: "1.5px solid rgba(201,245,59,0.55)",
                    color: "#c9f53b",
                    background: "rgba(201,245,59,0.06)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "#c9f53b";
                    el.style.color = "#0c0c0c";
                    el.style.borderColor = "#c9f53b";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(201,245,59,0.06)";
                    el.style.color = "#c9f53b";
                    el.style.borderColor = "rgba(201,245,59,0.55)";
                  }}
                >
                  Sign In
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Hamburger – mobile only */}
            <button
              className="md:hidden shrink-0 ml-2 p-2 rounded-md focus:outline-none"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(v => !v)}
            >
              <MenuIcon open={menuOpen} />
            </button>

          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: menuOpen ? "100vh" : "0",
            background: "rgba(8,8,8,0.98)",
            borderTop: menuOpen ? "1px solid rgba(201,245,59,0.1)" : "none",
          }}
        >
          <nav className="flex flex-col px-4 py-4 gap-1">
            {ALL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium text-white/60 hover:text-[#c9f53b] hover:bg-[#c9f53b]/5 transition-all duration-150 select-none"
                style={{ fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "0.04em" }}
              >
                <span className="w-1 h-1 rounded-full bg-[#c9f53b]/40 shrink-0" />
                {link.label}
              </Link>
            ))}

            {/* Auth area – mobile drawer */}
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              {isAuthed ? (
                <>
                  {/* User info strip */}
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#c9f53b]/40" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ring-2 ring-[#c9f53b]/40"
                        style={{ background: "rgba(201,245,59,0.12)", color: "#c9f53b", fontFamily: "'Space Grotesk',sans-serif" }}>
                        {(session?.user?.name ?? session?.user?.email ?? "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white/90 truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                        {session?.user?.name ?? "User"}
                      </p>
                      {session?.user?.email && (
                        <p className="text-[10px] text-white/40 truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium text-white/60 hover:text-[#c9f53b] hover:bg-[#c9f53b]/5 transition-all duration-150"
                    style={{ fontFamily: "'Space Grotesk',sans-serif" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </Link>

                  <button
                    onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium text-white/60 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
                    style={{ fontFamily: "'Space Grotesk',sans-serif" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200"
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    letterSpacing: "0.05em",
                    border: "1.5px solid rgba(201,245,59,0.55)",
                    color: "#c9f53b",
                    background: "rgba(201,245,59,0.06)",
                  }}
                >
                  Sign In
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import gsap from "gsap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/journal/NotificationBell";

const ALL_LINKS = [
  { label: "Home",         href: "/" },
  { label: "About Us",     href: "/about" },
  { label: "Research",     href: "#" },
  { label: "Achievements", href: "/achievements" },
  { label: "Gallery",      href: "/gallery" },
  { label: "Team",         href: "/team" },
  { label: "Contact",      href: "/contact" },
];

const RESEARCH_CHILD_LINKS = [
  { label: "Journal", href: "/research/journal" },
  { label: "Conference", href: "/research/conferences" },
  { label: "Patent", href: "/research/patent" },
  { label: "Copyright", href: "/research/copyright" },
  { label: "Book Chapter", href: "/research/book-chapters" },
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
      className="relative group shrink-0 px-3 py-2.5 text-[12px] lg:text-[13px] font-medium text-foreground/60 dark:text-white/55 hover:text-primary transition-colors duration-200 select-none font-['Space_Grotesk'] tracking-[0.05em]"
    >
      {label}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary rounded-full transition-all duration-300 group-hover:w-4/5" />
      {withSep && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 bg-foreground/10 dark:bg-white/10 pointer-events-none" />
      )}
    </Link>
  );
}

function ResearchDropdown({ withSep = false }: { withSep?: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleEnter = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="relative shrink-0">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative group flex items-center gap-1 px-3 py-2.5 text-[12px] lg:text-[13px] font-medium text-foreground/60 dark:text-white/55 hover:text-primary transition-colors duration-200 select-none font-['Space_Grotesk'] tracking-[0.05em]"
            aria-label="Research menu"
          >
            Research
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary rounded-full transition-all duration-300 group-hover:w-4/5" />
            {withSep && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 bg-foreground/10 dark:bg-white/10 pointer-events-none" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className="w-52 rounded-xl border border-border/40 bg-background/95 dark:bg-card/95 p-1.5 backdrop-blur-xl"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {RESEARCH_CHILD_LINKS.map((item) => (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="rounded-md px-3 py-2 text-[12px] text-foreground/70 dark:text-white/70 transition-colors duration-150 focus:bg-primary/10 focus:text-primary"
            >
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Placeholder logo (swap with <Image> once you have real logos)
function LogoPlaceholder({ label, size = 56 }: { label: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-primary/60 bg-primary/10 font-bold text-primary select-none shrink-0 font-['Space_Grotesk']"
      style={{ width: size, height: size, fontSize: size * 0.28 }}
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
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/50 group-hover:ring-primary transition-all duration-200"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-primary/50 group-hover:ring-primary transition-all duration-200 text-[11px] font-bold bg-primary/15 text-primary font-['Space_Grotesk']"
          >
            {initials}
          </div>
        )}
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-primary/70 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50 bg-background/97 dark:bg-card/97 border border-border/40 shadow-2xl transition-colors duration-300"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-border/40">
            <p className="text-[12px] font-semibold text-foreground/90 truncate font-['Space_Grotesk']">
              {name ?? "User"}
            </p>
            {email && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-['Space_Grotesk']">
                {email}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-150 font-['Space_Grotesk']"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </Link>

            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-all duration-150 font-['Space_Grotesk']"
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
        className="fixed top-0 left-0 right-0 z-[100] w-full bg-background/90 dark:bg-background/95 backdrop-blur-md border-b border-border/40 transition-all duration-300"
      >
        {/* ── ROW 1 · Logo strip ── */}
        <div
          ref={topRowRef}
          className="w-full py-3 overflow-hidden"
          style={{ willChange: "height, opacity" }}
        >
          <div className=" mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">

            {/* LEFT LOGO – hidden on xs, shown sm+ */}
            <div className="hidden sm:flex shrink-0 items-center gap-2 lg:gap-3">
              {/* swap LogoPlaceholder with <Image src="/logos/left.png" …> */}
              <LogoPlaceholder label="L" size={48} />
              <div className="hidden lg:flex flex-col">
                <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest leading-tight font-['Space_Grotesk']">
                  Institute
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight font-['Space_Grotesk']">
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
                  className="text-[11px] sm:text-[13px] lg:text-[14.5px] font-bold leading-snug truncate font-['Space_Grotesk'] tracking-[0.03em] bg-gradient-to-r from-primary to-[#a8e63b] bg-clip-text text-transparent"
                >
                  Innovation &amp; Entrepreneurship Development Cell
                </span>
                <span
                  className="hidden sm:block text-[9.5px] lg:text-[10.5px] text-muted-foreground leading-snug mt-0.5 font-['Space_Grotesk']"
                >
                  Dept. of Computer Science &amp; Engineering
                  <span className="hidden lg:inline"> · <span className="text-primary/75">IoT, Cyber Security &amp; Blockchain Technology</span></span>
                </span>
              </div>
            </div>

            {/* RIGHT LOGO – hidden on xs, shown sm+ */}
            <div className="hidden sm:flex shrink-0 items-center gap-2 lg:gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest leading-tight font-['Space_Grotesk']">
                  Partner
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight text-right font-['Space_Grotesk']">
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
          className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />

        {/* ── ROW 2 · Navigation bar ── */}
        <div className="w-full bg-background/95 border-b border-border/40 transition-colors duration-300">
          <div className=" mx-auto px-4 sm:px-6 lg:px-10 flex items-center h-11 gap-3">
            {/* Desktop row: links left, search right */}
            <div className="hidden md:flex flex-1 items-center min-w-0 gap-3">
              <nav className="flex items-center min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {ALL_LINKS.map((link, i) => (
                  link.label === "Research" ? (
                    <ResearchDropdown
                      key={link.href}
                      withSep={i < ALL_LINKS.length - 1}
                    />
                  ) : (
                    <NavLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      withSep={i < ALL_LINKS.length - 1}
                    />
                  )
                ))}
              </nav>

              <div className="ml-auto flex items-center gap-3 shrink-0">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notification Bell */}
                <NotificationBell />

                <div
                  className="flex items-center gap-2 rounded-md px-2.5 h-8 border border-border/40 dark:border-primary/20 bg-muted/20 dark:bg-primary/5"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/75"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-24 lg:w-32 xl:w-40 bg-transparent text-[12px] text-foreground/80 placeholder:text-muted-foreground/50 outline-none font-['Space_Grotesk'] tracking-[0.03em]"
                    aria-label="Search"
                  />
                </div>

                <div className="shrink-0 hidden md:flex items-center">
                  {status === "loading" ? (
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  ) : isAuthed ? (
                    <UserMenu
                      name={session.user?.name}
                      email={session.user?.email}
                      image={session.user?.image}
                    />
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-full transition-all duration-200 font-['Space_Grotesk'] tracking-[0.05em] border border-primary/55 text-primary bg-primary/5 hover:bg-primary hover:text-background"
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
              </div>
            </div>

            {/* Mobile: logo name shorthand + spacer */}
            <div className="flex md:hidden flex-1 items-center">
              <span
                className="text-[13px] font-bold font-['Space_Grotesk'] bg-gradient-to-r from-primary to-[#a8e63b] bg-clip-text text-transparent"
              >
                I.E.D.C
              </span>
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
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-background/98 border-t border-border/40 ${
            menuOpen ? "max-h-screen border-t" : "max-h-0 border-t-0"
          }`}
          style={{ maxHeight: menuOpen ? "100vh" : "0" }}
        >
          <nav className="flex flex-col px-4 py-4 gap-1">
            {ALL_LINKS.map((link) => (
              link.label === "Research" ? (
                <div key={link.href} className="rounded-lg border border-border/40 bg-muted/10">
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-3 text-[14px] font-medium text-foreground/70 hover:text-primary transition-all duration-150 select-none font-['Space_Grotesk'] tracking-[0.04em]"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                    {link.label}
                  </Link>
                  <div className="pb-2">
                    {RESEARCH_CHILD_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className="ml-7 mr-2 flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-150 font-['Space_Grotesk'] tracking-[0.03em]"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary/35 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-150 select-none font-['Space_Grotesk'] tracking-[0.04em]"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                  {link.label}
                </Link>
              )
            ))}

            {/* Auth area – mobile drawer */}
            <div className="mt-3 pt-3 border-t border-border/40">
              {/* Theme Toggle & Notification – mobile */}
              <div className="flex items-center gap-2 px-3 py-2 mb-3">
                <ThemeToggle />
                <NotificationBell />
              </div>

              {isAuthed ? (
                <>
                  {/* User info strip */}
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/40" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ring-2 ring-primary/40 bg-primary/15 text-primary font-['Space_Grotesk']">
                        {(session?.user?.name ?? session?.user?.email ?? "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground/90 truncate font-['Space_Grotesk']">
                        {session?.user?.name ?? "User"}
                      </p>
                      {session?.user?.email && (
                        <p className="text-[10px] text-muted-foreground truncate font-['Space_Grotesk']">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all duration-150 font-['Space_Grotesk']"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </Link>

                  <button
                    onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium text-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-all duration-150 font-['Space_Grotesk']"
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
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 font-['Space_Grotesk'] tracking-[0.05em] border border-primary/55 text-primary bg-primary/5 hover:bg-primary hover:text-background"
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

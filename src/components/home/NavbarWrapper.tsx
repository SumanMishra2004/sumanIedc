"use client";

import { useEffect, useState } from "react";
import Navbar from "./Navbar";

/**
 * NavbarWrapper component that provides proper spacing for content below the navbar.
 * The navbar has two states:
 * - Expanded: ~140px (logo strip + nav bar)
 * - Collapsed: ~45px (nav bar only, when scrolled)
 */
export default function NavbarWrapper({ children, homePageData }: { children: React.ReactNode; homePageData?: any }) {
  const [navbarHeight, setNavbarHeight] = useState(140); // Initial expanded height

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector("header");
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    // Initial measurement
    updateNavbarHeight();

    // Update on scroll (navbar collapses)
    const handleScroll = () => {
      updateNavbarHeight();
    };

    // Update on resize
    const handleResize = () => {
      updateNavbarHeight();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    // Use ResizeObserver for more accurate navbar height tracking
    const navbar = document.querySelector("header");
    let resizeObserver: ResizeObserver | null = null;

    if (navbar) {
      resizeObserver = new ResizeObserver(() => {
        updateNavbarHeight();
      });
      resizeObserver.observe(navbar);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (resizeObserver && navbar) {
        resizeObserver.unobserve(navbar);
      }
    };
  }, []);

  return (
    <>
      <Navbar data={homePageData} />
      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div style={{ height: `${navbarHeight}px` }} className="shrink-0" />
      {/* Main content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </>
  );
}

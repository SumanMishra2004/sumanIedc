"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

/**
 * Initialises Lenis smooth scroll and wires it into GSAP's ticker +
 * ScrollTrigger so all scroll-driven animations stay in sync.
 * Only active on the home page ("/").
 */
export default function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;

    const lenis = new Lenis({
      duration: 1.3,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8,
    });

    // Keep GSAP ScrollTrigger positions in sync
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis with the same rAF loop as GSAP
    const rafCb = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCb);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafCb);
      lenis.destroy();
    };
  }, [isHomePage]);

  return <>{children}</>;
}



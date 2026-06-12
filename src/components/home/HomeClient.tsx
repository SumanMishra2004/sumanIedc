"use client";

import { useEffect, useRef, useState } from "react";
import AboutUs from "@/components/home/AboutUs";
import HeroSection from "@/components/home/HeroSection";
import Navbar from "@/components/home/Navbar";
import VelocityMarquee from "@/components/home/ScrollMarquee";
import LoadingScreen from "@/components/home/LoadingScreen";
import LabCarousel from "./ViewImages";
import Achievements from "./Achievements";
import OurJourney from "./OurJourney";
import UpcomingEvents from "./UpcomingEvents";
import Footer from "./Footer";

import type { HomePageData, MilestoneData, GallerySlideData } from "../../../sanity/lib/queries";

const MIN_LOAD_MS = 2200;

interface HomeClientProps {
  homePageData?: HomePageData | null;
  milestones?: MilestoneData[] | null;
  gallerySlides?: GallerySlideData[] | null;
}

export default function HomeClient({ homePageData, milestones, gallerySlides }: HomeClientProps) {
  const [progress, setProgress]     = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showScreen, setShowScreen] = useState(true);

  const startTimeRef  = useRef<number>(0);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const domReadyRef   = useRef(false);

  // ── Step progress with randomised increments up to 88 % ──────────────────
  useEffect(() => {
    startTimeRef.current = Date.now();
    let current = 0;

    intervalRef.current = setInterval(() => {
      const remaining = 88 - current;
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        return;
      }
      const step = Math.random() * Math.min(remaining * 0.2, 4) + 0.5;
      current = Math.min(current + step, 88);
      setProgress(Math.round(current));
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Finalise loader when DOM + assets are ready AND min time has elapsed ──
  useEffect(() => {
    const finish = () => {
      if (domReadyRef.current) return;
      domReadyRef.current = true;

      const elapsed = Date.now() - startTimeRef.current;
      const delay   = Math.max(0, MIN_LOAD_MS - elapsed);

      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(100);
        setTimeout(() => setIsComplete(true), 350);
      }, delay);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      return () => window.removeEventListener("load", finish);
    }
  }, []);

  return (
    <>
      {showScreen && (
        <LoadingScreen
          progress={progress}
          isComplete={isComplete}
          onExit={() => setShowScreen(false)}
        />
      )}

      {/* Page content renders behind the loader so everything is pre-initialised */}
      <div
        style={{
          opacity: showScreen ? 0 : 1,
          transition: "opacity 0.4s ease",
          pointerEvents: showScreen ? "none" : "auto",
        }}
      >
        <div className="flex flex-col w-full bg-background text-foreground transition-colors duration-300">
          <Navbar />
          <HeroSection data={homePageData} />
          <AboutUs data={homePageData} />
          <VelocityMarquee />
          <Achievements />
          <OurJourney milestones={milestones} />
          <UpcomingEvents />
          <LabCarousel slides={gallerySlides} />
          <Footer />
        </div>
      </div>
    </>
  );
}

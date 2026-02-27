"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

interface LoadingScreenProps {
  /** 0 – 100 */
  progress: number;
  /** Flip to true to trigger the exit animation */
  isComplete: boolean;
  /** Called once the exit animation finishes — parent should unmount on this */
  onExit: () => void;
}

export default function LoadingScreen({
  progress,
  isComplete,
  onExit,
}: LoadingScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const countRef   = useRef<HTMLSpanElement>(null);
  const barRef     = useRef<HTMLDivElement>(null);
  const dotsRef    = useRef<HTMLDivElement>(null);

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".ls-brand", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.1,
      });
      gsap.from(".ls-sub", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.3,
      });

      // Staggered dot pulse
      if (dotsRef.current) {
        gsap.to(dotsRef.current.querySelectorAll("span"), {
          scaleY: 2,
          transformOrigin: "bottom center",
          duration: 0.5,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
          stagger: 0.15,
        });
      }
    }, overlayRef);

    return () => ctx.revert();
  }, []);

  // ── Progress bar & counter ────────────────────────────────────────────────
  useEffect(() => {
    const obj = { val: 0 };

    gsap.to(obj, {
      val: progress,
      duration: 0.5,
      ease: "power2.out",
      onUpdate() {
        const v = Math.round(obj.val);
        if (countRef.current) countRef.current.textContent = String(v);
        if (barRef.current)   barRef.current.style.transform = `scaleX(${v / 100})`;
      },
    });
  }, [progress]);

  // ── Exit animation ────────────────────────────────────────────────────────
  const runExit = useCallback(() => {
    if (!overlayRef.current) return;

    const tl = gsap.timeline({ onComplete: onExit });

    // Counter snaps to 100
    if (countRef.current) countRef.current.textContent = "100";
    if (barRef.current)   barRef.current.style.transform = "scaleX(1)";

    tl.to(".ls-inner", {
      y: -20,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
    })
      // Wipe the overlay UP
      .to(
        overlayRef.current,
        {
          yPercent: -100,
          duration: 0.85,
          ease: "power4.inOut",
        },
        "-=0.05"
      );
  }, [onExit]);

  useEffect(() => {
    if (isComplete) runExit();
  }, [isComplete, runExit]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#060610",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "'Sora', 'Inter', sans-serif",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(201,245,59,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,245,59,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,245,59,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Inner content */}
      <div className="ls-inner" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Brand */}
        <div className="ls-brand" style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: "clamp(3rem, 10vw, 7rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              lineHeight: 1,
              fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
            }}
          >
            IED
            <span style={{ color: "#c9f53b" }}>C</span>
          </span>
        </div>

        <p
          className="ls-sub"
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 64,
          }}
        >
          Innovation &amp; Entrepreneurship Development Cell
        </p>

        {/* Counter */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 4,
            marginBottom: 32,
          }}
        >
          <span
            ref={countRef}
            style={{
              fontSize: "clamp(4rem, 14vw, 9rem)",
              fontWeight: 900,
              color: "#c9f53b",
              lineHeight: 1,
              fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif",
              minWidth: "3ch",
              textAlign: "right",
            }}
          >
            0
          </span>
          <span
            style={{
              fontSize: "clamp(1.5rem, 5vw, 3rem)",
              fontWeight: 700,
              color: "rgba(201,245,59,0.4)",
              lineHeight: 1,
              paddingBottom: "0.4em",
            }}
          >
            %
          </span>
        </div>

        {/* Animated bars */}
        <div
          ref={dotsRef}
          style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 40 }}
        >
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: 3,
                height: 18,
                borderRadius: 2,
                backgroundColor: i === 2 ? "#c9f53b" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar — bottom of screen */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          ref={barRef}
          style={{
            height: "100%",
            backgroundColor: "#c9f53b",
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />
      </div>
    </div>
  );
}

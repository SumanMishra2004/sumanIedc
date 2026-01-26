"use client";

import React, { useState, useRef } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type Item = {
  id: number;
  name: string;
  email: string;
  image?: string;
};

export const AnimatedAvatarGroupTooltip = ({
  items,
  maxCount = 4,
}: {
  items: Item[];
  maxCount?: number;
}) => {
  const [hoveredId, setHoveredId] = useState<number | "overflow" | null>(null);
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const springConfig = { stiffness: 120, damping: 14 };

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-35, 35]),
    springConfig
  );

  const translateX = useSpring(
    useTransform(x, [-100, 100], [-40, 40]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const halfWidth = event.currentTarget.offsetWidth / 2;
      x.set(event.nativeEvent.offsetX - halfWidth);
    });
  };

  const visibleItems = items.slice(0, maxCount);
  const overflowItems = items.slice(maxCount);

  return (
    <div className="flex items-center">
      {/* Visible Avatars */}
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className="group relative -mr-4"
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence>
            {hoveredId === item.id && (
              <Tooltip
                name={item.name}
                email={item.email}
                rotate={rotate}
                translateX={translateX}
              />
            )}
          </AnimatePresence>

          <Avatar className="h-9 w-9 border-2 border-background transition-transform group-hover:scale-105">
            <AvatarImage src={item.image} />
            <AvatarFallback>
              {item.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}

      {/* Overflow Avatar */}
      {overflowItems.length > 0 && (
        <div
          className="group relative"
          onMouseEnter={() => setHoveredId("overflow")}
          onMouseLeave={() => setHoveredId(null)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence>
            {hoveredId === "overflow" && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.9 }}
                style={{ rotate, translateX }}
                className="
                  absolute -top-16 left-1/2 -translate-x-1/2
                  rounded-md bg-black px-4 py-2 text-xs
                  text-white shadow-xl whitespace-nowrap
                "
              >
                <div className="font-semibold">
                  +{overflowItems.length} more
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {overflowItems
                    .slice(0, 3)
                    .map((u) => u.name)
                    .join(", ")}
                  {overflowItems.length > 3 && "…"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Avatar className="h-9 w-9 border-2 border-background bg-muted text-xs font-medium">
            <AvatarFallback>+{overflowItems.length}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
};

/* ---------------- Tooltip Component ---------------- */

const Tooltip = ({
  name,
  email,
  rotate,
  translateX,
}: {
  name: string;
  email: string;
  rotate: any;
  translateX: any;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.85 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 16, scale: 0.85 }}
    style={{ rotate, translateX }}
    className="
      absolute -top-12 left-1/2 -translate-x-1/2 z-550
      rounded-md bg-black px-4 py-2 text-xs
      shadow-xl whitespace-nowrap
    "
  >
    <div className="text-sm font-semibold text-white">{name}</div>
    <div className="text-[11px] text-muted-foreground">{email}</div>
  </motion.div>
);

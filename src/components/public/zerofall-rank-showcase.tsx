"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type ZerofallRank = {
  id: string;
  name: string;
  image: string;
  accent: string;
  glow: string;
};

export type ZerofallRankShowcaseProps = {
  intervalMs?: number;
  pauseOnHover?: boolean;
  showLabel?: boolean;
};

export const zerofallRanks: readonly ZerofallRank[] = [
  {
    id: "core",
    name: "Core",
    image: "/ranks/core.png",
    accent: "#4B5563",
    glow: "rgba(75, 85, 99, 0.28)",
  },
  {
    id: "verified",
    name: "Verified",
    image: "/ranks/verified.png",
    accent: "#8FC7FF",
    glow: "rgba(143, 199, 255, 0.28)",
  },
  {
    id: "elite",
    name: "Elite",
    image: "/ranks/elite.png",
    accent: "#D2A85A",
    glow: "rgba(210, 168, 90, 0.28)",
  },
  {
    id: "vanguard",
    name: "Vanguard",
    image: "/ranks/vanguard.png",
    accent: "#8B5CF6",
    glow: "rgba(139, 92, 246, 0.26)",
  },
  {
    id: "zero-crown",
    name: "Zero Crown",
    image: "/ranks/zero-crown.png",
    accent: "#DCEEFF",
    glow: "rgba(220, 238, 255, 0.32)",
  },
  {
    id: "genesis-founder",
    name: "Genesis Founder",
    image: "/ranks/genesis-founder.png",
    accent: "#C0C0C0",
    glow: "rgba(192, 192, 192, 0.28)",
  },
] as const;

const emblemTransition = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 18,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 1.03,
    y: -16,
    filter: "blur(10px)",
  },
};

export function ZerofallRankShowcase({
  intervalMs = 2200,
  pauseOnHover = true,
  showLabel = true,
}: ZerofallRankShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const activeRank = zerofallRanks[activeIndex] ?? zerofallRanks[0];
  const shouldPause = pauseOnHover && isHovered;

  useEffect(() => {
    if (shouldPause || zerofallRanks.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % zerofallRanks.length);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, shouldPause]);

  const progressLabel = useMemo(
    () => `${activeIndex + 1} / ${zerofallRanks.length}`,
    [activeIndex],
  );

  return (
    <div
      className="relative mt-10 max-w-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_42%),linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] px-6 py-8 shadow-[0_22px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
            Rank Progression
          </p>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">
            {progressLabel}
          </p>
        </div>

        <div className="relative mt-8 flex min-h-[22rem] flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRank.id}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={emblemTransition}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex flex-col items-center"
            >
              <motion.div
                aria-hidden
                className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ backgroundColor: activeRank.glow }}
                animate={{
                  opacity: [0.58, 0.82, 0.58],
                  scale: [0.94, 1.06, 0.94],
                }}
                transition={{
                  duration: 3.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="relative flex h-52 w-52 items-center justify-center rounded-[2rem] border border-white/8 bg-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-56 sm:w-56"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-[1px] rounded-[1.85rem] border border-white/[0.04]"
                />
                <Image
                  src={activeRank.image}
                  alt={activeRank.name}
                  width={168}
                  height={168}
                  className="relative z-10 h-auto w-full object-contain drop-shadow-[0_20px_38px_rgba(0,0,0,0.45)]"
                  priority
                />
              </motion.div>

              {showLabel ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="mt-7 text-center"
                >
                  <p
                    className="text-sm font-medium tracking-[0.22em] uppercase"
                    style={{ color: activeRank.accent }}
                  >
                    {activeRank.name}
                  </p>
                </motion.div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Rank progression">
          {zerofallRanks.map((rank, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={rank.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show ${rank.name}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "group relative h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                  isActive ? "w-10" : "w-2.5 hover:w-6",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-full border border-white/10 bg-white/10 transition-all duration-300",
                    isActive && "border-transparent bg-white/70",
                  )}
                  style={{
                    backgroundColor: isActive ? rank.accent : undefined,
                    boxShadow: isActive ? `0 0 18px ${rank.glow}` : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

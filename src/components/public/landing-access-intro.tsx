"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export type LandingAccessIntroProps = {
  children: React.ReactNode;
  storageKey?: string;
};

export const defaultLandingIntroLines = [
  "Welcome to the elite.",
  "You made it.",
  "ZERØFALL access granted.",
  "Initializing private environment...",
] as const;

export const defaultLandingIntroTiming = {
  preludeMs: 220,
  charMs: 38,
  lineGapMs: 140,
  holdMs: 520,
  revealMs: 1500,
  overlayFadeDelayMs: 880,
  overlayFadeMs: 520,
} as const;

type IntroPhase = "checking" | "typing" | "revealing" | "complete";

export function getLandingIntroTotalDurationMs(
  lines = defaultLandingIntroLines,
  timing = defaultLandingIntroTiming,
) {
  const characterCount = lines.reduce((total, line) => total + line.length, 0);

  return (
    timing.preludeMs +
    characterCount * timing.charMs +
    Math.max(lines.length - 1, 0) * timing.lineGapMs +
    timing.holdMs +
    timing.revealMs
  );
}

function subscribeToLandingIntroCompletion() {
  return () => undefined;
}

function getLandingIntroCompletionSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(storageKey) === "1";
}

export function LandingAccessIntro({
  children,
  storageKey = "zerofall:landing-intro-complete",
}: LandingAccessIntroProps) {
  const prefersReducedMotion = useReducedMotion();
  const introAlreadyCompleted = useSyncExternalStore(
    subscribeToLandingIntroCompletion,
    () => getLandingIntroCompletionSnapshot(storageKey),
    () => false,
  );
  const [phase, setPhase] = useState<IntroPhase>("typing");
  const [typedLines, setTypedLines] = useState<string[]>(
    defaultLandingIntroLines.map(() => ""),
  );
  const [activeLineIndex, setActiveLineIndex] = useState(0);

  const timing = useMemo(
    () =>
      prefersReducedMotion
        ? {
            preludeMs: 100,
            charMs: 18,
            lineGapMs: 70,
            holdMs: 180,
            revealMs: 900,
            overlayFadeDelayMs: 460,
            overlayFadeMs: 260,
          }
        : defaultLandingIntroTiming,
    [prefersReducedMotion],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (introAlreadyCompleted) {
      return;
    }

    const timeouts: number[] = [];
    let offset = timing.preludeMs;

    const schedule = (callback: () => void, delay: number) => {
      const timeout = window.setTimeout(callback, delay);
      timeouts.push(timeout);
    };

    defaultLandingIntroLines.forEach((line, lineIndex) => {
      schedule(() => {
        setActiveLineIndex(lineIndex);
      }, offset);

      for (let charIndex = 1; charIndex <= line.length; charIndex += 1) {
        const nextSlice = line.slice(0, charIndex);

        schedule(() => {
          setTypedLines((current) => {
            const next = [...current];
            next[lineIndex] = nextSlice;
            return next;
          });
        }, offset);

        offset += timing.charMs;
      }

      if (lineIndex < defaultLandingIntroLines.length - 1) {
        offset += timing.lineGapMs;
      }
    });

    const revealStartsAt = offset + timing.holdMs;

    schedule(() => {
      setPhase("revealing");
    }, revealStartsAt);

    schedule(() => {
      window.sessionStorage.setItem(storageKey, "1");
      setPhase("complete");
    }, revealStartsAt + timing.revealMs);

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [introAlreadyCompleted, storageKey, timing]);

  const effectivePhase = introAlreadyCompleted ? "complete" : phase;
  const isContentInteractive = effectivePhase === "complete";
  const activeLine = defaultLandingIntroLines[activeLineIndex] ?? "";

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={
          effectivePhase === "revealing" || effectivePhase === "complete"
            ? {
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }
            : {
                opacity: 0.08,
                scale: 1.035,
                filter: "blur(18px)",
              }
        }
        transition={{
          duration: timing.revealMs / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={isContentInteractive ? "" : "pointer-events-none select-none"}
        aria-hidden={!isContentInteractive}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {effectivePhase !== "complete" ? (
          <motion.div
            key="landing-intro-overlay"
            initial={{ opacity: 1 }}
            animate={
              effectivePhase === "revealing"
                ? { opacity: 0 }
                : { opacity: 1 }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: timing.overlayFadeMs / 1000,
              delay:
                effectivePhase === "revealing"
                  ? timing.overlayFadeDelayMs / 1000
                  : 0,
              ease: "easeInOut",
            }}
            className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_30%),linear-gradient(180deg,#050505_0%,#030303_100%)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%,transparent_66%,rgba(255,255,255,0.02))]" />
            <motion.div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(220,238,255,0.08)] blur-3xl"
              animate={{
                opacity: [0.2, 0.42, 0.2],
                scale: [0.95, 1.04, 0.95],
              }}
              transition={{
                duration: 3.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />

            <div className="relative mx-auto w-full max-w-3xl px-8 text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-zinc-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-300/70" />
                Restricted Access Layer
              </div>

              <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-white/8 bg-black/25 px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-8 sm:py-10">
                <div className="space-y-4 font-mono text-left text-[clamp(1rem,2.4vw,1.6rem)] leading-relaxed tracking-[0.03em] text-[#E5E7EB]">
                  {defaultLandingIntroLines.map((line, lineIndex) => {
                    const visibleLine = typedLines[lineIndex] ?? "";
                    const isCurrentLine =
                      lineIndex === activeLineIndex &&
                      visibleLine.length < line.length &&
                      effectivePhase !== "revealing";

                    return (
                      <div
                        key={line}
                        className="flex min-h-[1.8em] items-center justify-center gap-1 sm:justify-start"
                      >
                        <span className="whitespace-pre-wrap text-center sm:text-left">
                          {visibleLine || "\u00A0"}
                        </span>
                        {isCurrentLine ||
                        (effectivePhase === "revealing" && line === activeLine) ? (
                          <motion.span
                            aria-hidden
                            className="inline-block h-[1.1em] w-px bg-[#F4F5F7]"
                            animate={{ opacity: [1, 0.25, 1] }}
                            transition={{
                              duration: 1.05,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

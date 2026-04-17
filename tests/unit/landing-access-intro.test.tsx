import { describe, expect, it } from "vitest";

import {
  defaultLandingIntroLines,
  getLandingIntroTotalDurationMs,
} from "@/components/public/landing-access-intro";

describe("landing access intro", () => {
  it("keeps the approved line order", () => {
    expect(defaultLandingIntroLines).toEqual([
      "Welcome to the elite.",
      "You made it.",
      "ZERØFALL access granted.",
      "Initializing private environment...",
    ]);
  });

  it("keeps the full intro ritual inside the target duration band", () => {
    const totalDuration = getLandingIntroTotalDurationMs();

    expect(totalDuration).toBeGreaterThanOrEqual(5500);
    expect(totalDuration).toBeLessThanOrEqual(6500);
  });
});

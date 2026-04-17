import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ZerofallRankShowcase,
  zerofallRanks,
} from "@/components/public/zerofall-rank-showcase";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt?: string } & Record<string, unknown>) => (
    <div data-testid="next-image" data-alt={alt ?? ""} {...props} />
  ),
}));

describe("zerofall rank showcase", () => {
  it("exports the requested rank progression in order", () => {
    expect(zerofallRanks.map((rank) => rank.name)).toEqual([
      "Core",
      "Verified",
      "Elite",
      "Vanguard",
      "Zero Crown",
      "Genesis Founder",
    ]);
  });

  it("renders the active label by default", () => {
    render(<ZerofallRankShowcase intervalMs={99999} />);

    expect(screen.getByText("Core")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Show Core" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("supports hiding the label while keeping manual navigation", () => {
    render(<ZerofallRankShowcase intervalMs={99999} showLabel={false} />);

    expect(screen.queryByText("Core")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Show Genesis Founder" })).toBeInTheDocument();
  });
});

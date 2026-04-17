import { classifyActivationWindow } from "@/server/queries/staff-activations";

describe("staff activations", () => {
  it("classifies activation windows by urgency", () => {
    const now = new Date("2026-04-14T21:00:00.000Z");

    expect(classifyActivationWindow(null, now)).toBe("missing_deadline");
    expect(
      classifyActivationWindow(new Date("2026-04-14T20:59:00.000Z"), now),
    ).toBe("overdue");
    expect(
      classifyActivationWindow(new Date("2026-04-15T10:00:00.000Z"), now),
    ).toBe("critical");
    expect(
      classifyActivationWindow(new Date("2026-04-17T10:00:00.000Z"), now),
    ).toBe("healthy");
  });
});

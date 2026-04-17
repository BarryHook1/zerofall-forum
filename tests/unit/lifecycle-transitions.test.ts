import {
  entryStatuses,
  membershipStatuses,
} from "@/lib/lifecycle/enums";
import {
  assertLifecycleTransition,
  canTransitionLifecycle,
  getAllowedLifecycleTransitions,
} from "@/lib/lifecycle/transitions";

describe("lifecycle transitions", () => {
  it("exports the expected status enums", () => {
    expect(entryStatuses).toEqual([
      "visitor",
      "entry_pending",
      "entry_confirmed",
      "revoked",
    ]);
    expect(membershipStatuses).toEqual([
      "none",
      "awaiting_activation",
      "active",
      "dormant",
      "decayed",
      "revoked",
    ]);
  });

  it("allows the defined lifecycle transitions", () => {
    expect(canTransitionLifecycle("visitor", "entry_pending")).toBe(true);
    expect(canTransitionLifecycle("entry_pending", "entry_confirmed")).toBe(true);
    expect(canTransitionLifecycle("entry_confirmed", "awaiting_activation")).toBe(true);
    expect(canTransitionLifecycle("awaiting_activation", "active")).toBe(true);
    expect(canTransitionLifecycle("active", "dormant")).toBe(true);
    expect(canTransitionLifecycle("dormant", "decayed")).toBe(true);
    expect(canTransitionLifecycle("decayed", "active")).toBe(true);
  });

  it("rejects invalid lifecycle transitions", () => {
    expect(canTransitionLifecycle("visitor", "active")).toBe(false);
    expect(() => assertLifecycleTransition("awaiting_activation", "dormant")).toThrow(
      "Invalid lifecycle transition: awaiting_activation -> dormant",
    );
  });

  it("returns the allowed next states for a given status", () => {
    expect(getAllowedLifecycleTransitions("active")).toEqual(["dormant", "revoked"]);
  });
});

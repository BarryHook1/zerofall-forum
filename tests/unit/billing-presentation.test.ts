import {
  canOpenMembershipCheckout,
  isReactivationState,
  renewalIntentLabel,
} from "@/lib/billing/presentation";

describe("billing presentation", () => {
  it("identifies recovery states", () => {
    expect(isReactivationState("dormant")).toBe(true);
    expect(isReactivationState("decayed")).toBe(true);
    expect(isReactivationState("active")).toBe(false);
  });

  it("blocks checkout only for revoked membership", () => {
    expect(canOpenMembershipCheckout("active")).toBe(true);
    expect(canOpenMembershipCheckout("awaiting_activation")).toBe(true);
    expect(canOpenMembershipCheckout("revoked")).toBe(false);
  });

  it("labels the billing action by lifecycle state", () => {
    expect(renewalIntentLabel("active")).toBe("Open Renewal Checkout");
    expect(renewalIntentLabel("dormant")).toBe("Open Recovery Checkout");
    expect(renewalIntentLabel("decayed")).toBe("Open Recovery Checkout");
    expect(renewalIntentLabel("awaiting_activation")).toBe("Open Membership Checkout");
  });
});

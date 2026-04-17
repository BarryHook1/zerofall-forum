import { selectActiveSubscription } from "@/server/queries/member-billing";

describe("member billing overview helpers", () => {
  it("prefers the active subscription when present", () => {
    expect(
      selectActiveSubscription([
        { status: "expired", id: "sub-1" },
        { status: "active", id: "sub-2" },
      ]),
    ).toEqual({ status: "active", id: "sub-2" });
  });

  it("falls back to the latest available subscription when none are active", () => {
    expect(
      selectActiveSubscription([
        { status: "expired", id: "sub-1" },
        { status: "canceled", id: "sub-2" },
      ]),
    ).toEqual({ status: "expired", id: "sub-1" });

    expect(selectActiveSubscription([])).toBeNull();
  });
});

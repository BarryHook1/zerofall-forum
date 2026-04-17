import { formatForumUid } from "@/lib/formatting/uid";
import { UidService } from "@/server/services/uid-service";

describe("uid service", () => {
  it("formats the public-facing UID with padding", () => {
    expect(formatForumUid(1)).toBe("#0001");
    expect(formatForumUid(42)).toBe("#0042");
    expect(formatForumUid(null)).toBe("Pending");
  });

  it("rejects UID issuance before the entry payment is paid", async () => {
    const service = new UidService({
      async getForumSequence() {
        return { currentValue: 7 };
      },
      async updateForumSequence() {},
    });

    await expect(
      service.issueNextUid({
        purchase: { status: "pending" },
        user: { forumUid: null },
      }),
    ).rejects.toThrow("UID can only be issued after a paid entry purchase");
  });

  it("increments the sequence monotonically", async () => {
    let currentValue = 7;
    const service = new UidService({
      async getForumSequence() {
        return { currentValue };
      },
      async updateForumSequence(nextValue) {
        currentValue = nextValue;
      },
    });

    const first = await service.issueNextUid({
      purchase: { status: "paid" },
      user: { forumUid: null },
    });
    const second = await service.issueNextUid({
      purchase: { status: "paid" },
      user: { forumUid: null },
    });

    expect(first).toBe(8);
    expect(second).toBe(9);
  });

  it("reuses the existing UID on the user record instead of reissuing", async () => {
    const service = new UidService({
      async getForumSequence() {
        return { currentValue: 99 };
      },
      async updateForumSequence() {
        throw new Error("should not update sequence");
      },
    });

    const uid = await service.issueNextUid({
      purchase: { status: "paid" },
      user: { forumUid: 12 },
    });

    expect(uid).toBe(12);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const publishUserEvent = vi.fn();

const tx = {
  user: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  activationWindow: {
    updateMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/billing/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/server/services/bot-webhook-publisher", () => ({
  BotWebhookPublisher: class {
    publishUserEvent = publishUserEvent;
  },
}));

describe("membership activation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks the member as active and publishes subscription.activated", async () => {
    tx.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "member@example.com",
      entryStatus: "entry_confirmed",
      membershipStatus: "awaiting_activation",
    });
    tx.user.findUniqueOrThrow.mockResolvedValue({
      id: "user-1",
      username: "membername",
      email: "member@example.com",
      forumUid: 42,
      discordId: null,
      entryStatus: "entry_confirmed",
      membershipStatus: "active",
      rank: "genesis_founder",
      badgeStatus: "enabled",
      activationDeadline: new Date("2026-04-17T00:00:00.000Z"),
      subscriptionExpiresAt: new Date("2026-05-17T00:00:00.000Z"),
    });
    tx.subscription.upsert.mockResolvedValue(undefined);
    tx.user.update.mockResolvedValue(undefined);
    tx.activationWindow.updateMany.mockResolvedValue(undefined);
    tx.auditLog.create.mockResolvedValue(undefined);

    const { MembershipService } = await import("@/server/services/membership-service");
    const service = new MembershipService();

    const user = await service.activateFromSubscription({
      userId: "user-1",
      providerSubscriptionId: "sub_123",
      currentPeriodEnd: 1_778_976_000,
    });

    expect(tx.subscription.upsert).toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        membershipStatus: "active",
        subscriptionExpiresAt: expect.any(Date),
      },
    });
    expect(user.membershipStatus).toBe("active");
    expect(publishUserEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "subscription.activated",
      }),
    );
  });
});

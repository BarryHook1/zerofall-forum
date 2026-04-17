import { beforeEach, describe, expect, it, vi } from "vitest";

const publishUserEvent = vi.fn();

const tx = {
  entryPurchase: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  uidSequence: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  activationWindow: {
    create: vi.fn(),
  },
  auditLog: {
    createMany: vi.fn(),
  },
};

const prismaMock = {
  entryPurchase: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

describe("entry provisioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an account, issues a UID, and publishes member.created only once", async () => {
    prismaMock.entryPurchase.findFirst.mockResolvedValue({
      id: "purchase-1",
      email: "member@example.com",
      requestedUsername: "membername",
      requestedPasswordHash: "hash",
      amount: 0,
      currency: "usd",
      user: null,
    });
    tx.entryPurchase.findUnique.mockResolvedValue({
      id: "purchase-1",
      userId: null,
      email: "member@example.com",
      requestedUsername: "membername",
      requestedPasswordHash: "hash",
      amount: 0,
      currency: "usd",
    });
    tx.uidSequence.findUniqueOrThrow.mockResolvedValue({
      currentValue: 41,
    });
    tx.user.create.mockResolvedValue({
      id: "user-1",
      username: "membername",
      email: "member@example.com",
      forumUid: 42,
      discordId: null,
      entryStatus: "entry_confirmed",
      membershipStatus: "awaiting_activation",
      rank: "genesis_founder",
      badgeStatus: "enabled",
      activationDeadline: new Date("2026-04-17T00:00:00.000Z"),
      subscriptionExpiresAt: null,
    });
    tx.entryPurchase.update.mockResolvedValue(undefined);
    tx.activationWindow.create.mockResolvedValue(undefined);
    tx.auditLog.createMany.mockResolvedValue(undefined);

    const { EntryService } = await import("@/server/services/entry-service");
    const service = new EntryService();

    const user = await service.provisionFromCheckoutSession({
      id: "checkout-1",
      payment_intent: "pi_123",
      amount_total: 10000,
      currency: "usd",
    });

    expect(user.forumUid).toBe(42);
    expect(tx.uidSequence.update).toHaveBeenCalledWith({
      where: { name: "forum_uid" },
      data: { currentValue: 42 },
    });
    expect(tx.activationWindow.create).toHaveBeenCalled();
    expect(publishUserEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "member.created",
      }),
    );
  });
});

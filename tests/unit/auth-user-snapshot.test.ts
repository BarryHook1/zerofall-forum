import { describe, expect, it } from "vitest";

import {
  applyAuthSnapshotToToken,
  applyTokenToSession,
  mapUserRecordToAuthSnapshot,
} from "@/lib/auth/user-snapshot";

describe("auth user snapshot helpers", () => {
  it("maps a prisma user record into auth-safe serialized fields", () => {
    const snapshot = mapUserRecordToAuthSnapshot({
      id: "user-1",
      email: "founder@example.com",
      username: "founder",
      forumUid: 7,
      accountRole: "founder",
      entryStatus: "entry_confirmed",
      membershipStatus: "active",
      rank: "genesis_founder",
      badgeStatus: "enabled",
      activationDeadline: new Date("2026-04-20T00:00:00.000Z"),
      subscriptionExpiresAt: new Date("2026-05-20T00:00:00.000Z"),
      discordId: "1234567890",
    });

    expect(snapshot).toEqual({
      id: "user-1",
      email: "founder@example.com",
      username: "founder",
      forumUid: 7,
      accountRole: "founder",
      entryStatus: "entry_confirmed",
      membershipStatus: "active",
      rank: "genesis_founder",
      badgeStatus: "enabled",
      activationDeadline: "2026-04-20T00:00:00.000Z",
      subscriptionExpiresAt: "2026-05-20T00:00:00.000Z",
      discordId: "1234567890",
    });
  });

  it("applies the current database snapshot into the jwt token and session", () => {
    const token = applyAuthSnapshotToToken(
      {},
      {
        id: "user-1",
        email: "founder@example.com",
        username: "founder",
        forumUid: 7,
        accountRole: "founder",
        entryStatus: "entry_confirmed",
        membershipStatus: "active",
        rank: "genesis_founder",
        badgeStatus: "enabled",
        activationDeadline: "2026-04-20T00:00:00.000Z",
        subscriptionExpiresAt: "2026-05-20T00:00:00.000Z",
        discordId: "1234567890",
      },
    );

    const session = applyTokenToSession(
      {
        expires: "2026-06-01T00:00:00.000Z",
        user: {},
      },
      token,
    );

    expect(session.user).toMatchObject({
      id: "user-1",
      email: "founder@example.com",
      username: "founder",
      forumUid: 7,
      accountRole: "founder",
      entryStatus: "entry_confirmed",
      membershipStatus: "active",
      rank: "genesis_founder",
      badgeStatus: "enabled",
      activationDeadline: "2026-04-20T00:00:00.000Z",
      subscriptionExpiresAt: "2026-05-20T00:00:00.000Z",
      discordId: "1234567890",
    });
  });
});

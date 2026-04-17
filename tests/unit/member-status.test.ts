import { buildMemberMilestones } from "@/server/queries/member-status";

describe("member status helpers", () => {
  it("derives milestones from forum-owned member state", () => {
    expect(
      buildMemberMilestones({
        entryStatus: "entry_confirmed",
        forumUid: 42,
        membershipStatus: "active",
        discordId: "1234567890",
        badgeStatus: "enabled",
      }),
    ).toEqual([
      { label: "Genesis Entry Confirmed", reached: true },
      { label: "UID Issued", reached: true },
      { label: "Membership Active", reached: true },
      { label: "Discord Linked", reached: true },
      { label: "Badge Enabled", reached: true },
    ]);
  });
});

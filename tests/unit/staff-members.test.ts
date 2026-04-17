import {
  parseForumUidQuery,
  normalizeMemberSearchQuery,
} from "@/server/queries/staff-members";

describe("staff members search", () => {
  it("parses numeric UID search inputs safely", () => {
    expect(parseForumUidQuery("#0042")).toBe(42);
    expect(parseForumUidQuery("42")).toBe(42);
    expect(parseForumUidQuery("user@example.com")).toBeNull();
  });

  it("normalizes string and array search params", () => {
    expect(normalizeMemberSearchQuery("  #0042  ")).toBe("#0042");
    expect(normalizeMemberSearchQuery([" user@example.com ", "ignored"])).toBe(
      "user@example.com",
    );
    expect(normalizeMemberSearchQuery(undefined)).toBe("");
  });
});

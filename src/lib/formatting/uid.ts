export function formatForumUid(uid: number | null | undefined) {
  if (!uid || uid < 1) {
    return "Pending";
  }

  return `#${String(uid).padStart(4, "0")}`;
}

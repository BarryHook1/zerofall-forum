export function getDiscordLinkFlash(code: string | null | undefined) {
  switch (code) {
    case "linked":
      return {
        tone: "success" as const,
        title: "Discord linked",
        description:
          "The forum saved your Discord identity and queued a fresh sync event for the bot.",
      };
    case "unlinked":
      return {
        tone: "neutral" as const,
        title: "Discord unlinked",
        description:
          "The forum removed the linked Discord account. Future mirror events will stay skipped until you link again.",
      };
    case "oauth-unavailable":
      return {
        tone: "error" as const,
        title: "Discord OAuth unavailable",
        description:
          "The forum is missing Discord OAuth configuration, so the link flow cannot start yet.",
      };
    case "auth-required":
      return {
        tone: "error" as const,
        title: "Session required",
        description:
          "You need an active forum session to complete the Discord link callback.",
      };
    case "state-mismatch":
      return {
        tone: "error" as const,
        title: "Invalid link state",
        description:
          "The Discord callback did not match the forum-owned state token. Restart the link flow.",
      };
    case "access-denied":
      return {
        tone: "error" as const,
        title: "Discord link canceled",
        description:
          "Discord returned the callback without approval, so the forum did not store a link.",
      };
    case "discord-in-use":
      return {
        tone: "error" as const,
        title: "Discord already linked",
        description:
          "That Discord account is already bound to another forum member and cannot be reused.",
      };
    case "exchange-failed":
      return {
        tone: "error" as const,
        title: "Discord exchange failed",
        description:
          "The forum could not finish the OAuth exchange with Discord. Try again.",
      };
    case "identity-failed":
      return {
        tone: "error" as const,
        title: "Discord identity unavailable",
        description:
          "Discord did not return a usable identity payload for the forum to store.",
      };
    default:
      return null;
  }
}

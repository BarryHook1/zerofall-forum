// Wire error codes returned to the C++ loader. Keep stable — clients
// pin behavior on these strings.

export const CHEAT_ERRORS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  NO_LICENSE: "no_license",
  LICENSE_REVOKED: "license_revoked",
  LICENSE_EXPIRED: "license_expired",
  HWID_LIMIT_REACHED: "hwid_limit_reached",
  INVALID_SESSION: "invalid_session",
  SESSION_EXPIRED: "session_expired",
  HWID_MISMATCH: "hwid_mismatch",
  OFFSETS_UNAVAILABLE: "offsets_unavailable",
  RATE_LIMITED: "rate_limited",
  BAD_REQUEST: "bad_request",
  SERVER_ERROR: "server_error",
} as const;

export type CheatErrorCode = (typeof CHEAT_ERRORS)[keyof typeof CHEAT_ERRORS];

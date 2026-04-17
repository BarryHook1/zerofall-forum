import type { UserLifecycleStatus } from "./enums";

const allowedTransitions: Record<UserLifecycleStatus, readonly UserLifecycleStatus[]> = {
  visitor: ["entry_pending"],
  entry_pending: ["entry_confirmed"],
  entry_confirmed: ["awaiting_activation"],
  awaiting_activation: ["active", "revoked"],
  active: ["dormant", "revoked"],
  dormant: ["active", "decayed", "revoked"],
  decayed: ["active", "revoked"],
  revoked: [],
};

export function canTransitionLifecycle(
  from: UserLifecycleStatus,
  to: UserLifecycleStatus,
) {
  return allowedTransitions[from].includes(to);
}

export function assertLifecycleTransition(
  from: UserLifecycleStatus,
  to: UserLifecycleStatus,
) {
  if (!canTransitionLifecycle(from, to)) {
    throw new Error(`Invalid lifecycle transition: ${from} -> ${to}`);
  }
}

export function getAllowedLifecycleTransitions(status: UserLifecycleStatus) {
  return allowedTransitions[status];
}

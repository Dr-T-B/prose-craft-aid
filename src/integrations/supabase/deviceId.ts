// Stable per-browser device id used to scope anonymous user-state rows
// (saved_essay_plans, timed_sessions, reflection_entries) via the
// `x-device-id` request header consumed by the `is_owner` RLS function.

const KEY = "c2p.deviceId.v1";

function generate(): string {
  // Prefer crypto.randomUUID where available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== "undefined" ? crypto : null;
  if (c?.randomUUID) return c.randomUUID();
  return `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function getDeviceId(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = generate();
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    // Fallback for non-browser / private contexts
    return "dev_ephemeral";
  }
}

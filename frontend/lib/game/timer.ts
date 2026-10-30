/** Milliseconds left before `endsAt`, never negative. */
export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now);
}

export function isExpired(endsAt: number, now: number): boolean {
  return now >= endsAt;
}

/** Seconds elapsed since `startedAt`, capped at the match duration. */
export function elapsedSec(startedAt: number, endsAt: number, now: number): number {
  return (Math.min(now, endsAt) - startedAt) / 1000;
}

/** "9:05" style clock. Rounds up so the clock shows 0:00 only at expiry. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, "0")}s`;
}

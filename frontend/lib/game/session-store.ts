"use client";

import type { MatchConfig, MatchResult, MatchState } from "@/types/competition";

/**
 * Browser session persistence for the current match. This is the only place
 * the game touches storage, so a server store (e.g. Supabase) can replace it
 * later without changing the competition engine.
 */
const KEYS = {
  match: "mech-esports:match",
  result: "mech-esports:result",
  config: "mech-esports:config",
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / quota): the match still runs in memory.
  }
}

export const sessionStore = {
  loadMatch: () => read<MatchState>(KEYS.match),
  saveMatch: (state: MatchState) => write(KEYS.match, state),
  loadResult: () => read<MatchResult>(KEYS.result),
  saveResult: (result: MatchResult) => write(KEYS.result, result),
  loadConfig: () => read<MatchConfig>(KEYS.config),
  saveConfig: (config: MatchConfig) => write(KEYS.config, config),
  clearMatch: () => {
    try {
      window.sessionStorage.removeItem(KEYS.match);
      window.sessionStorage.removeItem(KEYS.result);
    } catch {
      // ignore
    }
  },
};

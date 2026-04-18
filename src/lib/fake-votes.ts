// Deterministic UI-only fake vote inflation. Pure cosmetics; never written to DB.
// Same seed → same number, so counts feel stable across renders.

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

/**
 * Returns a stable fake vote count for a given key.
 * @param key Unique identifier (e.g. team short name, player name, match+team)
 * @param min Minimum fake votes
 * @param max Maximum fake votes
 */
export const getFakeVotes = (key: string, min = 120, max = 4800): number => {
  const h = hash(key);
  return min + (h % (max - min + 1));
};

/** Inflate a real vote map with fake votes. UI ONLY. */
export const inflateVotes = (
  realCounts: Record<string, number>,
  keys: string[],
  scope: string,
  min = 120,
  max = 4800
): Record<string, number> => {
  const out: Record<string, number> = {};
  keys.forEach(k => {
    out[k] = (realCounts[k] || 0) + getFakeVotes(`${scope}:${k}`, min, max);
  });
  return out;
};

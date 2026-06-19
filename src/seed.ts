// Mulberry32 PRNG — fast, deterministic, and good enough for shuffling a deck.
export const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const MIN_SEED = 1;
const MAX_SEED = 999_999_999;

export const generateRandomSeed = (): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % MAX_SEED) + MIN_SEED;
};

export const parseSeed = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const seed = Number(trimmed);
  if (!Number.isSafeInteger(seed) || seed < MIN_SEED || seed > MAX_SEED) return null;
  return seed;
};

export const readSeedFromUrl = (): number | null => {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("game") ?? params.get("seed");
  if (raw === null) return null;
  return parseSeed(raw);
};

export const writeSeedToUrl = (seed: number): void => {
  const url = new URL(window.location.href);
  url.searchParams.set("game", String(seed));
  url.searchParams.delete("seed");
  window.history.replaceState(null, "", url);
};

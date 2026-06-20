import { hasWon } from "./gameEngine";
import type { GameState } from "./gameReducer";
import type { Card, LocationType, Suit } from "./types";

const STORAGE_KEY = "reactcell.savedGame";
// Bump when the persisted shape changes so stale saves are discarded instead of
// crashing or producing a corrupt board.
const SCHEMA_VERSION = 3;
const TOTAL_CARDS = 52;

// Only the durable parts of the game are persisted. Transient UI state
// (announcements, deal animation, pending focus) is intentionally dropped so a
// resumed game starts in a clean, non-animating state.
interface SavedGame {
  version: number;
  seed: number;
  cards: GameState["cards"];
  selectedKey: GameState["selectedKey"];
  history: GameState["history"];
}

const SUITS: Suit[] = ["♣", "♦", "♥", "♠"];
const LOCATIONS: LocationType[] = ["cascade", "foundation", "freeCell"];

const isValidCard = (value: unknown, key: string): value is Card => {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  if (typeof card.rank !== "number" || card.rank < 0 || card.rank > 12) return false;
  if (typeof card.suit !== "string" || !SUITS.includes(card.suit as Suit)) return false;
  if (card.objKey !== key) return false;
  if (card.location !== null && !LOCATIONS.includes(card.location as LocationType)) return false;
  return true;
};

const isValidDeck = (cards: unknown): cards is GameState["cards"] => {
  if (typeof cards !== "object" || cards === null) return false;
  const keys = Object.keys(cards);
  if (keys.length !== TOTAL_CARDS) return false;
  return keys.every((key) => isValidCard((cards as Record<string, unknown>)[key], key));
};

const isValidSeed = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 999_999_999;

const isValidHistory = (value: unknown): value is GameState["history"] => {
  if (!Array.isArray(value)) return false;
  return value.every((entry) => isValidDeck(entry));
};

// Reads a previously saved game. Returns null (so the caller deals a fresh game)
// for any missing, unavailable, malformed, outdated, or already-won save.
export const loadGame = ():
  | (Pick<GameState, "cards" | "selectedKey" | "history"> & { seed: number })
  | null => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage can throw (e.g. disabled cookies, private mode).
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const save = parsed as Partial<SavedGame>;
  if (save.version !== SCHEMA_VERSION) return null;
  if (!isValidSeed(save.seed)) return null;
  if (!isValidDeck(save.cards)) return null;

  // Don't resume a finished game; start fresh instead.
  if (hasWon(save.cards)) return null;

  const selectedKey =
    typeof save.selectedKey === "string" && save.cards[save.selectedKey] ? save.selectedKey : null;

  const history = isValidHistory(save.history) ? save.history : [];

  return { cards: save.cards, selectedKey, seed: save.seed, history };
};

// Persists the durable game state. Silently ignores storage failures and skips
// empty boards (the brief moment before the first deal).
export const saveGame = (
  state: Pick<GameState, "cards" | "selectedKey" | "history"> & { seed: number },
): void => {
  if (Object.keys(state.cards).length === 0) return;
  const save: SavedGame = {
    version: SCHEMA_VERSION,
    seed: state.seed,
    cards: state.cards,
    selectedKey: state.selectedKey,
    history: state.history,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Best-effort persistence; ignore quota/availability errors.
  }
};

export const clearSavedGame = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
};

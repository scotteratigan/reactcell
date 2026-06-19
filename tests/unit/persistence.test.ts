import { afterEach, describe, expect, it } from "vitest";
import { shuffleAndDeal } from "../../src/gameEngine";
import { clearSavedGame, loadGame, saveGame } from "../../src/persistence";
import type { Card, Suit } from "../../src/types";

const STORAGE_KEY = "reactcell.savedGame";

afterEach(() => {
  localStorage.clear();
});

// A complete, won deck: all 52 cards on the foundations.
const wonDeck = () => {
  const cards: Record<string, Card> = {};
  const suits: Suit[] = ["♣", "♦", "♥", "♠"];
  suits.forEach((suit, col) => {
    for (let rank = 0; rank <= 12; rank++) {
      cards[rank + suit] = {
        rank,
        suit,
        objKey: rank + suit,
        location: "foundation",
        column: col,
        position: rank,
      };
    }
  });
  return cards;
};

describe("persistence round trip", () => {
  it("saves and restores a dealt game", () => {
    const cards = shuffleAndDeal();
    saveGame({ cards, selectedKey: null, seed: 123456789 });

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.cards).toEqual(cards);
    expect(loaded!.selectedKey).toBeNull();
    expect(loaded!.seed).toBe(123456789);
  });

  it("restores a valid selection", () => {
    const cards = shuffleAndDeal();
    const someKey = Object.keys(cards)[0];
    saveGame({ cards, selectedKey: someKey, seed: 42 });

    expect(loadGame()!.selectedKey).toBe(someKey);
  });

  it("drops a selection that no longer points at a real card", () => {
    const cards = shuffleAndDeal();
    saveGame({ cards, selectedKey: "not-a-card", seed: 42 });

    expect(loadGame()!.selectedKey).toBeNull();
  });
});

describe("persistence guards", () => {
  it("returns null when nothing is saved", () => {
    expect(loadGame()).toBeNull();
  });

  it("ignores malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadGame()).toBeNull();
  });

  it("ignores a save with a different schema version", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, seed: 1, cards: shuffleAndDeal(), selectedKey: null }),
    );
    expect(loadGame()).toBeNull();
  });

  it("ignores a save with an invalid seed", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, seed: 0, cards: shuffleAndDeal(), selectedKey: null }),
    );
    expect(loadGame()).toBeNull();
  });

  it("ignores a deck that is not 52 valid cards", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        seed: 1,
        cards: { "0♣": { rank: 0, suit: "♣", objKey: "0♣", location: null } },
        selectedKey: null,
      }),
    );
    expect(loadGame()).toBeNull();
  });

  it("ignores a card whose objKey does not match its map key", () => {
    const cards = shuffleAndDeal() as Record<string, Card>;
    const key = Object.keys(cards)[0];
    cards[key] = { ...cards[key], objKey: "tampered" };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, seed: 1, cards, selectedKey: null }),
    );
    expect(loadGame()).toBeNull();
  });

  it("does not resume an already-won game", () => {
    saveGame({ cards: wonDeck(), selectedKey: null, seed: 1 });
    expect(loadGame()).toBeNull();
  });

  it("does not persist an empty board", () => {
    saveGame({ cards: {}, selectedKey: null, seed: 1 });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears a saved game", () => {
    saveGame({ cards: shuffleAndDeal(), selectedKey: null, seed: 1 });
    clearSavedGame();
    expect(loadGame()).toBeNull();
  });
});

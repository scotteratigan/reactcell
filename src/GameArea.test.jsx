import { describe, expect, it, vi } from "vitest";
import GameArea from "./GameArea";

function createGameArea(state = {}) {
  const gameArea = new GameArea({});

  gameArea.state = {
    ...gameArea.state,
    cards: {},
    cascades: [[], [], [], [], [], [], [], []],
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    selectedKey: null,
    ...state
  };

  return gameArea;
}

describe("GameArea card rules", () => {
  it("identifies red and black suits", () => {
    const gameArea = createGameArea();

    expect(gameArea.getCardColor({ suit: "♦" })).toBe("red");
    expect(gameArea.getCardColor({ suit: "♥" })).toBe("red");
    expect(gameArea.getCardColor({ suit: "♣" })).toBe("black");
    expect(gameArea.getCardColor({ suit: "♠" })).toBe("black");
  });

  it("moves an ace to an empty foundation", () => {
    const gameArea = createGameArea({
      cards: {
        "0♣": { rank: 0, suit: "♣" }
      }
    });
    gameArea.moveCard = vi.fn();

    const moved = gameArea.tryToStackCardOnFoundation({
      cardKey: "0♣",
      column: 2
    });

    expect(moved).toBe(true);
    expect(gameArea.moveCard).toHaveBeenCalledWith({
      cardKey: "0♣",
      location: "foundation",
      column: 2,
      position: 0
    });
  });

  it("does not move a non-ace to an empty foundation", () => {
    const gameArea = createGameArea({
      cards: {
        "5♣": { rank: 5, suit: "♣" }
      }
    });
    gameArea.moveCard = vi.fn();

    const moved = gameArea.tryToStackCardOnFoundation({
      cardKey: "5♣",
      column: 0
    });

    expect(moved).toBe(false);
    expect(gameArea.moveCard).not.toHaveBeenCalled();
  });

  it("moves the next same-suit card onto a foundation stack", () => {
    const gameArea = createGameArea({
      cards: {
        "1♠": { rank: 1, suit: "♠" }
      },
      foundations: [[{ rank: 0, suit: "♠" }], [], [], []]
    });
    gameArea.moveCard = vi.fn();

    const moved = gameArea.tryToStackCardOnFoundation({
      cardKey: "1♠",
      column: 0
    });

    expect(moved).toBe(true);
    expect(gameArea.moveCard).toHaveBeenCalledWith({
      cardKey: "1♠",
      location: "foundation",
      column: 0,
      position: 1
    });
  });

  it("moves a card onto a cascade when color alternates and rank descends", () => {
    const gameArea = createGameArea({
      cards: {
        "6♥": { rank: 6, suit: "♥" }
      },
      cascades: [
        [{ rank: 7, suit: "♣", position: 0 }],
        [],
        [],
        [],
        [],
        [],
        [],
        []
      ]
    });
    gameArea.moveCard = vi.fn();

    gameArea.tryToMoveToCascade({
      cardKey: "6♥",
      column: 0
    });

    expect(gameArea.moveCard).toHaveBeenCalledWith({
      cardKey: "6♥",
      location: "cascade",
      column: 0,
      position: 1
    });
  });

  it("does not move a card onto a cascade of the same color", () => {
    const gameArea = createGameArea({
      cards: {
        "6♥": { rank: 6, suit: "♥" }
      },
      cascades: [
        [{ rank: 7, suit: "♦", position: 0 }],
        [],
        [],
        [],
        [],
        [],
        [],
        []
      ]
    });
    gameArea.moveCard = vi.fn();

    gameArea.tryToMoveToCascade({
      cardKey: "6♥",
      column: 0
    });

    expect(gameArea.moveCard).not.toHaveBeenCalled();
  });
});

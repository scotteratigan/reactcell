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
    ...state,
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
        "0♣": { rank: 0, suit: "♣" },
      },
    });
    gameArea.moveCard = vi.fn<GameArea["moveCard"]>();

    const moved = gameArea.tryToStackCardOnFoundation({
      cardKey: "0♣",
      column: 2,
    });

    expect(moved).toBe(true);
    expect(gameArea.moveCard).toHaveBeenCalledWith({
      cardKey: "0♣",
      location: "foundation",
      column: 2,
      position: 0,
    });
  });

  it("does not move a non-ace to an empty foundation", () => {
    const gameArea = createGameArea({
      cards: {
        "5♣": { rank: 5, suit: "♣" },
      },
    });
    gameArea.moveCard = vi.fn<GameArea["moveCard"]>();

    const moved = gameArea.tryToStackCardOnFoundation({
      cardKey: "5♣",
      column: 0,
    });

    expect(moved).toBe(false);
    expect(gameArea.moveCard).not.toHaveBeenCalled();
  });

  it("moves the next same-suit card onto a foundation stack", () => {
    const gameArea = createGameArea({
      cards: {
        "1♠": { rank: 1, suit: "♠" },
      },
      foundations: [[{ rank: 0, suit: "♠" }], [], [], []],
    });
    gameArea.moveCard = vi.fn<GameArea["moveCard"]>();

    const moved = gameArea.tryToStackCardOnFoundation({
      cardKey: "1♠",
      column: 0,
    });

    expect(moved).toBe(true);
    expect(gameArea.moveCard).toHaveBeenCalledWith({
      cardKey: "1♠",
      location: "foundation",
      column: 0,
      position: 1,
    });
  });

  it("moves a card onto a cascade when color alternates and rank descends", () => {
    const gameArea = createGameArea({
      cards: {
        "6♥": { rank: 6, suit: "♥" },
      },
      cascades: [[{ rank: 7, suit: "♣", position: 0 }], [], [], [], [], [], [], []],
    });
    gameArea.moveCard = vi.fn<GameArea["moveCard"]>();

    gameArea.tryToMoveToCascade({
      cardKey: "6♥",
      column: 0,
    });

    expect(gameArea.moveCard).toHaveBeenCalledWith({
      cardKey: "6♥",
      location: "cascade",
      column: 0,
      position: 1,
    });
  });

  it("does not move a card onto a cascade of the same color", () => {
    const gameArea = createGameArea({
      cards: {
        "6♥": { rank: 6, suit: "♥" },
      },
      cascades: [[{ rank: 7, suit: "♦", position: 0 }], [], [], [], [], [], [], []],
    });
    gameArea.moveCard = vi.fn<GameArea["moveCard"]>();

    gameArea.tryToMoveToCascade({
      cardKey: "6♥",
      column: 0,
    });

    expect(gameArea.moveCard).not.toHaveBeenCalled();
  });
});

describe("GameArea sequence (multi-card) moves", () => {
  type SequenceCard = {
    rank: number;
    suit: string;
    objKey: string;
    location: string;
    column: number;
    position: number;
  };

  // A descending, alternating-color run: 6♥ (red) over 5♠ (black) over 4♥ (red).
  const sequenceCards = (): Record<string, SequenceCard> => ({
    "6♥": { rank: 6, suit: "♥", objKey: "6♥", location: "cascade", column: 0, position: 0 },
    "5♠": { rank: 5, suit: "♠", objKey: "5♠", location: "cascade", column: 0, position: 1 },
    "4♥": { rank: 4, suit: "♥", objKey: "4♥", location: "cascade", column: 0, position: 2 },
  });

  const sequenceCascade = (cards: Record<string, SequenceCard>) => [
    [cards["6♥"], cards["5♠"], cards["4♥"]],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ];

  it("recognizes a legal descending alternating-color run", () => {
    const cards = sequenceCards();
    const gameArea = createGameArea({ cards, cascades: sequenceCascade(cards) });

    expect(gameArea.isValidSequence(["6♥", "5♠", "4♥"])).toBe(true);
  });

  it("rejects a run whose colors do not alternate", () => {
    const cards = {
      "6♥": { rank: 6, suit: "♥", objKey: "6♥" },
      "5♦": { rank: 5, suit: "♦", objKey: "5♦" },
    };
    const gameArea = createGameArea({ cards });

    expect(gameArea.isValidSequence(["6♥", "5♦"])).toBe(false);
  });

  it("rejects a run whose ranks do not descend by one", () => {
    const cards = {
      "6♥": { rank: 6, suit: "♥", objKey: "6♥" },
      "4♠": { rank: 4, suit: "♠", objKey: "4♠" },
    };
    const gameArea = createGameArea({ cards });

    expect(gameArea.isValidSequence(["6♥", "4♠"])).toBe(false);
  });

  it("returns the run from a mid-cascade card down to the bottom", () => {
    const cards = sequenceCards();
    const gameArea = createGameArea({ cards, cascades: sequenceCascade(cards) });

    expect(gameArea.getCascadeRun("5♠")).toEqual(["5♠", "4♥"]);
  });

  it("treats a free cell card as a run of one", () => {
    const cards = {
      "6♥": { rank: 6, suit: "♥", objKey: "6♥", location: "freeCell", column: 0 },
    };
    const gameArea = createGameArea({ cards });

    expect(gameArea.getCascadeRun("6♥")).toEqual(["6♥"]);
  });

  // A board with `emptyCount` empty columns; the rest hold a single card.
  const cascadesWithEmpties = (emptyCount: number) => {
    const filled = { rank: 0, suit: "♣" };
    return Array.from({ length: 8 }, (_, i) => (i < 8 - emptyCount ? [filled] : []));
  };

  it("computes max movable cards as (free cells + 1) * 2 ^ empty columns", () => {
    const gameArea = createGameArea({
      freeCells: [null, null, null, null],
      cascades: cascadesWithEmpties(2),
    });

    // 4 free cells + 1 = 5, two empty columns -> 5 * 2^2 = 20.
    expect(gameArea.maxMovableCards(false)).toBe(20);
  });

  it("does not count the destination column when it is empty", () => {
    const gameArea = createGameArea({
      freeCells: [null, null, null, null],
      cascades: cascadesWithEmpties(2),
    });

    // Moving onto one of the empty columns leaves one empty column: 5 * 2^1 = 10.
    expect(gameArea.maxMovableCards(true)).toBe(10);
  });

  it("moves a legal run onto a matching cascade card", () => {
    const cards = sequenceCards();
    cards["7♣"] = { rank: 7, suit: "♣", objKey: "7♣", location: "cascade", column: 1, position: 0 };
    const cascades = sequenceCascade(cards);
    cascades[1] = [cards["7♣"]];
    const gameArea = createGameArea({ cards, cascades });
    gameArea.moveRun = vi.fn<GameArea["moveRun"]>();

    const moved = gameArea.tryToMoveRunToCascade({ runKeys: ["6♥", "5♠", "4♥"], column: 1 });

    expect(moved).toBe(true);
    // Run is placed on top of 7♣ (length 1) starting at position 1.
    expect(gameArea.moveRun).toHaveBeenCalledWith(["6♥", "5♠", "4♥"], "cascade", 1, 1);
  });

  it("rejects a run when there are not enough free cells/empty columns", () => {
    const cards = sequenceCards();
    cards["7♣"] = { rank: 7, suit: "♣", objKey: "7♣", location: "cascade", column: 1, position: 0 };
    const cascades = sequenceCascade(cards);
    cascades[1] = [cards["7♣"]];
    // Fill the remaining columns so there are no empty columns.
    for (let i = 2; i < 8; i++) {
      cascades[i] = [
        { rank: 0, suit: "♣", objKey: "0♣", location: "cascade", column: i, position: 0 },
      ];
    }
    // No free cells, no empty columns -> max movable is 1.
    const gameArea = createGameArea({
      cards,
      cascades,
      freeCells: [
        { rank: 0, suit: "♣" },
        { rank: 1, suit: "♣" },
        { rank: 2, suit: "♣" },
        { rank: 3, suit: "♣" },
      ],
    });
    gameArea.moveRun = vi.fn<GameArea["moveRun"]>();

    const moved = gameArea.tryToMoveRunToCascade({ runKeys: ["6♥", "5♠", "4♥"], column: 1 });

    expect(moved).toBe(false);
    expect(gameArea.moveRun).not.toHaveBeenCalled();
  });

  it("rejects a run whose head does not stack on the destination", () => {
    const cards = sequenceCards();
    cards["7♥"] = { rank: 7, suit: "♥", objKey: "7♥", location: "cascade", column: 1, position: 0 };
    const cascades = sequenceCascade(cards);
    cascades[1] = [cards["7♥"]];
    const gameArea = createGameArea({ cards, cascades });
    gameArea.moveRun = vi.fn<GameArea["moveRun"]>();

    // 6♥ (red) cannot stack on 7♥ (red).
    const moved = gameArea.tryToMoveRunToCascade({ runKeys: ["6♥", "5♠", "4♥"], column: 1 });

    expect(moved).toBe(false);
    expect(gameArea.moveRun).not.toHaveBeenCalled();
  });

  it("moves a run onto an empty column when within the limit", () => {
    const cards = sequenceCards();
    const gameArea = createGameArea({
      cards,
      cascades: sequenceCascade(cards),
      freeCells: [null, null, null, null],
    });
    gameArea.moveRun = vi.fn<GameArea["moveRun"]>();

    const moved = gameArea.tryToMoveRunToCascade({ runKeys: ["6♥", "5♠", "4♥"], column: 3 });

    expect(moved).toBe(true);
    expect(gameArea.moveRun).toHaveBeenCalledWith(["6♥", "5♠", "4♥"], "cascade", 3, 0);
  });
});

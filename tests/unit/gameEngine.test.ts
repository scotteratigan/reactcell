import { describe, expect, it } from "vitest";
import {
  buildBoard,
  canAutoComplete,
  type CardMap,
  dealOrder,
  getCardColor,
  getCascadeRun,
  hasWon,
  isValidSequence,
  maxMovableCards,
  moveToFreeCell,
  nextAutoFoundationMove,
  shuffleAndDeal,
  tryMoveRunToCascade,
  tryStackOnFoundation,
} from "../../src/gameEngine";
import type { Card, LocationType, Suit } from "../../src/types";

const card = (
  rank: number,
  suit: Suit,
  location: LocationType | null = null,
  column?: number,
  position?: number,
): Card => ({ rank, suit, objKey: rank + suit, location, column, position });

const toMap = (cards: Card[]): CardMap =>
  cards.reduce<CardMap>((map, c) => {
    map[c.objKey] = c;
    return map;
  }, {});

describe("getCardColor", () => {
  it("identifies red and black suits", () => {
    expect(getCardColor({ suit: "♦" })).toBe("red");
    expect(getCardColor({ suit: "♥" })).toBe("red");
    expect(getCardColor({ suit: "♣" })).toBe("black");
    expect(getCardColor({ suit: "♠" })).toBe("black");
  });
});

describe("shuffleAndDeal", () => {
  it("deals all 52 cards across eight cascades", () => {
    const cards = shuffleAndDeal();
    expect(Object.keys(cards)).toHaveLength(52);
    const board = buildBoard(cards);
    const dealt = board.cascades.reduce((sum, col) => sum + col.length, 0);
    expect(dealt).toBe(52);
    expect(board.cascades.every((col) => col.length === 6 || col.length === 7)).toBe(true);
  });

  it("is deterministic given a fixed random source", () => {
    const seeded = () => 0.42;
    expect(shuffleAndDeal(seeded)).toEqual(shuffleAndDeal(seeded));
  });
});

describe("tryStackOnFoundation", () => {
  it("moves an ace to an empty foundation", () => {
    const cards = toMap([card(0, "♣")]);
    const board = buildBoard(cards);

    const next = tryStackOnFoundation(cards, board, "0♣", 2);

    expect(next).not.toBeNull();
    expect(next!["0♣"]).toMatchObject({ location: "foundation", column: 2, position: 0 });
  });

  it("does not move a non-ace to an empty foundation", () => {
    const cards = toMap([card(5, "♣")]);
    const board = buildBoard(cards);

    expect(tryStackOnFoundation(cards, board, "5♣", 0)).toBeNull();
  });

  it("moves the next same-suit card onto a foundation stack", () => {
    const cards = toMap([card(1, "♠"), card(0, "♠", "foundation", 0, 0)]);
    const board = buildBoard(cards);

    const next = tryStackOnFoundation(cards, board, "1♠", 0);

    expect(next).not.toBeNull();
    expect(next!["1♠"]).toMatchObject({ location: "foundation", column: 0, position: 1 });
  });

  it("does not mutate the previous card map", () => {
    const cards = toMap([card(0, "♣")]);
    const board = buildBoard(cards);

    tryStackOnFoundation(cards, board, "0♣", 0);

    expect(cards["0♣"].location).toBeNull();
  });
});

describe("tryMoveRunToCascade (single card)", () => {
  it("moves a card onto a cascade when color alternates and rank descends", () => {
    const cards = toMap([card(6, "♥"), card(7, "♣", "cascade", 0, 0)]);
    const board = buildBoard(cards);

    const next = tryMoveRunToCascade(cards, board, ["6♥"], 0);

    expect(next).not.toBeNull();
    expect(next!["6♥"]).toMatchObject({ location: "cascade", column: 0, position: 1 });
  });

  it("does not move a card onto a cascade of the same color", () => {
    const cards = toMap([card(6, "♥"), card(7, "♦", "cascade", 0, 0)]);
    const board = buildBoard(cards);

    expect(tryMoveRunToCascade(cards, board, ["6♥"], 0)).toBeNull();
  });
});

describe("sequence helpers", () => {
  // 6♥ (red) over 5♠ (black) over 4♥ (red) in column 0.
  const sequence = () =>
    toMap([
      card(6, "♥", "cascade", 0, 0),
      card(5, "♠", "cascade", 0, 1),
      card(4, "♥", "cascade", 0, 2),
    ]);

  it("recognizes a legal descending alternating-color run", () => {
    expect(isValidSequence(sequence(), ["6♥", "5♠", "4♥"])).toBe(true);
  });

  it("rejects a run whose colors do not alternate", () => {
    const cards = toMap([card(6, "♥"), card(5, "♦")]);
    expect(isValidSequence(cards, ["6♥", "5♦"])).toBe(false);
  });

  it("rejects a run whose ranks do not descend by one", () => {
    const cards = toMap([card(6, "♥"), card(4, "♠")]);
    expect(isValidSequence(cards, ["6♥", "4♠"])).toBe(false);
  });

  it("returns the run from a mid-cascade card down to the bottom", () => {
    const cards = sequence();
    expect(getCascadeRun(cards, buildBoard(cards), "5♠")).toEqual(["5♠", "4♥"]);
  });

  it("treats a free cell card as a run of one", () => {
    const cards = toMap([card(6, "♥", "freeCell", 0, 0)]);
    expect(getCascadeRun(cards, buildBoard(cards), "6♥")).toEqual(["6♥"]);
  });
});

describe("maxMovableCards", () => {
  // A board with `emptyCount` empty columns; the rest hold a single card.
  const boardWithEmpties = (emptyCount: number) => {
    const cards: Card[] = [];
    for (let col = 0; col < 8 - emptyCount; col++) {
      cards.push(card(col, "♣", "cascade", col, 0));
    }
    return buildBoard(toMap(cards));
  };

  it("computes (free cells + 1) * 2 ^ empty columns", () => {
    // 4 free cells + 1 = 5, two empty columns -> 5 * 2^2 = 20.
    expect(maxMovableCards(boardWithEmpties(2), false)).toBe(20);
  });

  it("does not count the destination column when it is empty", () => {
    // Moving onto one of the empty columns leaves one empty column: 5 * 2^1 = 10.
    expect(maxMovableCards(boardWithEmpties(2), true)).toBe(10);
  });
});

describe("tryMoveRunToCascade (multi-card)", () => {
  const sequenceWith = (extra: Card[]) =>
    toMap([
      card(6, "♥", "cascade", 0, 0),
      card(5, "♠", "cascade", 0, 1),
      card(4, "♥", "cascade", 0, 2),
      ...extra,
    ]);

  it("moves a legal run onto a matching cascade card", () => {
    const cards = sequenceWith([card(7, "♣", "cascade", 1, 0)]);
    const board = buildBoard(cards);

    const next = tryMoveRunToCascade(cards, board, ["6♥", "5♠", "4♥"], 1);

    expect(next).not.toBeNull();
    // Run is placed on top of 7♣ (length 1) starting at position 1.
    expect(next!["6♥"]).toMatchObject({ column: 1, position: 1 });
    expect(next!["5♠"]).toMatchObject({ column: 1, position: 2 });
    expect(next!["4♥"]).toMatchObject({ column: 1, position: 3 });
  });

  it("rejects a run when there are not enough free cells/empty columns", () => {
    // Distinct cards so every cascade column is occupied (no empty columns).
    const filler: Card[] = [
      card(7, "♣", "cascade", 1, 0),
      card(8, "♣", "cascade", 2, 0),
      card(9, "♣", "cascade", 3, 0),
      card(10, "♣", "cascade", 4, 0),
      card(11, "♣", "cascade", 5, 0),
      card(12, "♣", "cascade", 6, 0),
      card(2, "♣", "cascade", 7, 0),
    ];
    const cards = sequenceWith(filler);
    // Occupy all four free cells so no slack remains: max movable is 1.
    const occupiedFreeCells = toMap([
      card(0, "♦", "freeCell", 0, 0),
      card(1, "♦", "freeCell", 1, 0),
      card(2, "♦", "freeCell", 2, 0),
      card(3, "♦", "freeCell", 3, 0),
    ]);
    const board = buildBoard({ ...cards, ...occupiedFreeCells });

    expect(tryMoveRunToCascade(cards, board, ["6♥", "5♠", "4♥"], 1)).toBeNull();
  });

  it("rejects a run whose head does not stack on the destination", () => {
    const cards = sequenceWith([card(7, "♥", "cascade", 1, 0)]);
    const board = buildBoard(cards);

    // 6♥ (red) cannot stack on 7♥ (red).
    expect(tryMoveRunToCascade(cards, board, ["6♥", "5♠", "4♥"], 1)).toBeNull();
  });

  it("moves a run onto an empty column when within the limit", () => {
    const cards = sequenceWith([]);
    const board = buildBoard(cards);

    const next = tryMoveRunToCascade(cards, board, ["6♥", "5♠", "4♥"], 3);

    expect(next).not.toBeNull();
    expect(next!["6♥"]).toMatchObject({ location: "cascade", column: 3, position: 0 });
  });
});

describe("moveToFreeCell", () => {
  it("places a card into the given free cell immutably", () => {
    const cards = toMap([card(9, "♦", "cascade", 0, 0)]);

    const next = moveToFreeCell(cards, "9♦", 2);

    expect(next["9♦"]).toMatchObject({ location: "freeCell", column: 2, position: 0 });
    expect(cards["9♦"].location).toBe("cascade");
  });
});

describe("dealOrder", () => {
  it("assigns a unique stagger index to every dealt card", () => {
    const cards = shuffleAndDeal();
    const order = dealOrder(buildBoard(cards));

    expect(Object.keys(order)).toHaveLength(52);
    expect(new Set(Object.values(order)).size).toBe(52);
    expect(Math.min(...Object.values(order))).toBe(0);
    expect(Math.max(...Object.values(order))).toBe(51);
  });

  it("matches the original row-by-row deal order for a fresh deal", () => {
    const cards = shuffleAndDeal();
    const board = buildBoard(cards);
    const order = dealOrder(board);

    // Earlier full rows index as position * 8 + column.
    board.cascades.forEach((column, col) => {
      column.forEach((card, position) => {
        expect(order[card.objKey]).toBe(position * 8 + col);
      });
    });
  });

  it("includes free cell and visible foundation cards after the cascades", () => {
    const cards = toMap([
      card(5, "♣", "cascade", 0, 0),
      card(9, "♦", "freeCell", 1, 0),
      card(0, "♠", "foundation", 3, 0),
      card(1, "♠", "foundation", 3, 1),
    ]);
    const order = dealOrder(buildBoard(cards));

    // The single cascade card is dealt first, then the free cell, then the top
    // foundation card. The buried foundation card (0♠) is not rendered.
    expect(order["5♣"]).toBe(0);
    expect(order["9♦"]).toBe(1);
    expect(order["1♠"]).toBe(2);
    expect(order["0♠"]).toBeUndefined();
  });
});

describe("hasWon", () => {
  it("is false for a partially-played deal", () => {
    expect(hasWon(shuffleAndDeal())).toBe(false);
  });

  it("is true only when all 52 cards are on foundations", () => {
    const cards: CardMap = {};
    const suits: Suit[] = ["♣", "♦", "♥", "♠"];
    suits.forEach((suit, col) => {
      for (let rank = 0; rank <= 12; rank++) {
        cards[rank + suit] = card(rank, suit, "foundation", col, rank);
      }
    });
    expect(hasWon(cards)).toBe(true);
  });
});

// A full 52-card layout where each suit occupies one cascade in descending
// order (King at top, Ace accessible at the bottom). This is trivially
// finishable by foundation moves alone.
const sortedCascades = (): CardMap => {
  const cards: CardMap = {};
  const suits: Suit[] = ["♣", "♦", "♥", "♠"];
  suits.forEach((suit, col) => {
    for (let rank = 0; rank <= 12; rank++) {
      // position 0 is the King; the Ace (rank 0) sits at the accessible bottom.
      cards[rank + suit] = card(rank, suit, "cascade", col, 12 - rank);
    }
  });
  return cards;
};

describe("nextAutoFoundationMove", () => {
  it("returns the first accessible card a foundation will accept", () => {
    const cards = sortedCascades();
    const move = nextAutoFoundationMove(cards, buildBoard(cards));

    // An ace is exposed at the bottom of column 0, and empty foundations accept
    // aces, so the first accessible move sends it to foundation column 0.
    expect(move).toEqual({ cardKey: "0♣", column: 0 });
  });

  it("returns null when no accessible card can go home", () => {
    // A lone King on the tableau has no foundation to build on yet.
    const cards = toMap([card(12, "♠", "cascade", 0, 0)]);

    expect(nextAutoFoundationMove(cards, buildBoard(cards))).toBeNull();
  });
});

describe("canAutoComplete", () => {
  it("is true when the board is finishable by foundation moves alone", () => {
    expect(canAutoComplete(sortedCascades())).toBe(true);
  });

  it("is false when a buried low card blocks completion", () => {
    // The King sits at the accessible bottom with the Ace trapped above it, so
    // foundation-only play can't reach the Ace and stalls immediately.
    const cards = toMap([card(0, "♣", "cascade", 0, 0), card(12, "♣", "cascade", 0, 1)]);

    expect(canAutoComplete(cards)).toBe(false);
  });

  it("is false for a freshly dealt game", () => {
    expect(canAutoComplete(shuffleAndDeal())).toBe(false);
  });
});

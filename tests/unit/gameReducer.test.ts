import { describe, expect, it } from "vitest";
import { buildBoard, type CardMap } from "../../src/gameEngine";
import { gameReducer, type GameState, initialState } from "../../src/gameReducer";
import type { Card, LocationType, Suit } from "../../src/types";

const card = (
  rank: number,
  suit: Suit,
  location: LocationType | null,
  column?: number,
  position?: number,
): Card => ({ rank, suit, objKey: rank + suit, location, column, position });

const stateFrom = (cards: Card[], overrides: Partial<GameState> = {}): GameState => ({
  ...initialState,
  cards: cards.reduce<CardMap>((map, c) => {
    map[c.objKey] = c;
    return map;
  }, {}),
  ...overrides,
});

describe("gameReducer selection", () => {
  it("selects a single card and announces it", () => {
    const state = stateFrom([card(5, "♣", "cascade", 0, 0)]);

    const next = gameReducer(state, { type: "SELECT_CARD", cardKey: "5♣" });

    expect(next.selectedKey).toBe("5♣");
    expect(next.announcement).toBe("Selected Six of Clubs. Choose where to move it.");
    // Selection must not touch the card map (so derived views are stable).
    expect(next.cards).toBe(state.cards);
  });

  it("announces a multi-card run selection", () => {
    const state = stateFrom([card(6, "♥", "cascade", 0, 0), card(5, "♠", "cascade", 0, 1)]);

    const next = gameReducer(state, { type: "SELECT_CARD", cardKey: "6♥" });

    expect(next.selectedKey).toBe("6♥");
    expect(next.announcement).toBe(
      "Selected 2 cards from Seven of Hearts. Choose where to move them.",
    );
  });

  it("refuses to select a card that does not head a movable sequence", () => {
    const state = stateFrom([card(6, "♥", "cascade", 0, 0), card(4, "♠", "cascade", 0, 1)]);

    const next = gameReducer(state, { type: "SELECT_CARD", cardKey: "6♥" });

    expect(next.selectedKey).toBeNull();
    expect(next.announcement).toBe("Seven of Hearts is not the top of a movable sequence.");
  });

  it("deselects when the selected card is clicked again with no foundation move", () => {
    const state = stateFrom([card(5, "♣", "cascade", 0, 0)], { selectedKey: "5♣" });

    const next = gameReducer(state, { type: "SELECT_CARD", cardKey: "5♣" });

    expect(next.selectedKey).toBeNull();
    expect(next.announcement).toBe("Deselected Six of Clubs.");
  });

  it("auto-sends a lone ace to a foundation when re-clicked", () => {
    const state = stateFrom([card(0, "♣", "cascade", 0, 0)], { selectedKey: "0♣" });

    const next = gameReducer(state, { type: "SELECT_CARD", cardKey: "0♣" });

    expect(next.cards["0♣"].location).toBe("foundation");
    expect(next.focusKey).toBe("0♣");
    expect(next.announcement).toBe("Moved Ace of Clubs to foundation 1.");
  });
});

describe("gameReducer moves", () => {
  it("moves a selected card to an empty free cell and follows focus", () => {
    const state = stateFrom([card(9, "♦", "cascade", 0, 0)], { selectedKey: "9♦" });

    const next = gameReducer(state, { type: "SELECT_EMPTY", location: "freeCell0" });

    expect(next.cards["9♦"]).toMatchObject({ location: "freeCell", column: 0 });
    expect(next.focusKey).toBe("9♦");
    expect(next.announcement).toBe("Moved Ten of Diamonds to free cell 1.");
  });

  it("refuses to move a multi-card run to a free cell", () => {
    const state = stateFrom([card(6, "♥", "cascade", 0, 0), card(5, "♠", "cascade", 0, 1)], {
      selectedKey: "6♥",
    });

    const next = gameReducer(state, { type: "SELECT_EMPTY", location: "freeCell0" });

    expect(next.announcement).toBe("Only a single card can move to a free cell.");
    expect(next.cards["6♥"].location).toBe("cascade");
  });

  it("announces an illegal foundation move instead of performing it", () => {
    const state = stateFrom([card(5, "♣", "cascade", 0, 0)], { selectedKey: "5♣" });

    const next = gameReducer(state, { type: "SELECT_EMPTY", location: "foundation0" });

    expect(next.announcement).toBe("Six of Clubs cannot move to foundation 1.");
    expect(next.cards["5♣"].location).toBe("cascade");
  });

  it("announces the win once the last card reaches a foundation", () => {
    const cards: Card[] = [];
    const suits: Suit[] = ["♣", "♦", "♥", "♠"];
    suits.forEach((suit, col) => {
      const top = suit === "♠" ? 11 : 12; // leave the King of Spades out
      for (let rank = 0; rank <= top; rank++) {
        cards.push(card(rank, suit, "foundation", col, rank));
      }
    });
    cards.push(card(12, "♠", "cascade", 0, 0));
    const state = stateFrom(cards, { selectedKey: "12♠" });

    const next = gameReducer(state, { type: "SELECT_EMPTY", location: "foundation3" });

    expect(buildBoard(next.cards).foundations[3]).toHaveLength(13);
    expect(next.announcement).toBe("You win! All cards are on the foundations.");
  });
});

describe("gameReducer deal", () => {
  it("DEAL replaces the board and clears selection", () => {
    const dealt: CardMap = { "0♣": card(0, "♣", "cascade", 0, 0) };
    const state = stateFrom([card(5, "♥", "cascade", 1, 0)], { selectedKey: "5♥" });

    const next = gameReducer(state, { type: "DEAL", cards: dealt });

    expect(next.cards).toBe(dealt);
    expect(next.selectedKey).toBeNull();
    expect(next.dealing).toBe(true);
    expect(next.announcement).toBe("");
  });

  it("END_DEAL clears the dealing flag", () => {
    const state = stateFrom([], { dealing: true });
    expect(gameReducer(state, { type: "END_DEAL" }).dealing).toBe(false);
  });
});

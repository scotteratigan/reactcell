import type { CardMap } from "./gameEngine";
import {
  buildBoard,
  cardName,
  getCascadeRun,
  hasWon,
  isValidSequence,
  locationName,
  maxMovableCards,
  moveToFreeCell,
  nextAutoFoundationMove,
  tryMoveRunToCascade,
  tryStackOnFoundation,
} from "./gameEngine";
import type { LocationType } from "./types";

export interface GameState {
  // The single source of truth. Everything else on screen is derived from this.
  cards: CardMap;
  selectedKey: string | null;
  announcement: string;
  dealing: boolean;
  // Card whose DOM node should receive focus after the next move-driven render,
  // so keyboard focus follows a card when it moves. Null for non-move updates.
  focusKey: string | null;
  // Snapshots of `cards` before each successful move, for undo back to the deal.
  history: CardMap[];
}

export type GameAction =
  | { type: "DEAL"; cards: CardMap }
  | { type: "END_DEAL" }
  | { type: "SELECT_CARD"; cardKey: string }
  | { type: "SELECT_EMPTY"; location: string }
  | { type: "DROP"; fromKey: string; location: string }
  | { type: "SEND_TO_FOUNDATION"; cardKey: string }
  | { type: "AUTO_FOUNDATION_STEP" }
  | { type: "UNDO" };

export const initialState: GameState = {
  cards: {},
  selectedKey: null,
  announcement: "",
  dealing: false,
  focusKey: null,
  history: [],
};

const cloneCardMap = (cards: CardMap): CardMap => {
  const cloned: CardMap = {};
  for (const key in cards) {
    cloned[key] = { ...cards[key] };
  }
  return cloned;
};

const WIN_ANNOUNCEMENT = "You win! All cards are on the foundations.";

// Builds the post-move state for a single card, preserving the win-overrides-
// move announcement behavior and moving keyboard focus to the card.
const movedCard = (
  prev: GameState,
  cards: CardMap,
  cardKey: string,
  location: LocationType,
  column: number,
): GameState => {
  const won = hasWon(cards);
  return {
    cards,
    selectedKey: null,
    dealing: prev.dealing,
    focusKey: cardKey,
    history: [...prev.history, cloneCardMap(prev.cards)],
    announcement: won
      ? WIN_ANNOUNCEMENT
      : `Moved ${cardName(cards[cardKey])} to ${locationName(location, column)}.`,
  };
};

// Builds the post-move state for a run, mirroring the single/multi announcement
// wording and focusing the head card.
const movedRun = (
  prev: GameState,
  cards: CardMap,
  runKeys: string[],
  location: LocationType,
  column: number,
): GameState => {
  const won = hasWon(cards);
  const head = cards[runKeys[0]];
  let announcement: string;
  if (won) {
    announcement = WIN_ANNOUNCEMENT;
  } else if (runKeys.length > 1) {
    announcement = `Moved ${runKeys.length} cards from ${cardName(head)} to ${locationName(location, column)}.`;
  } else {
    announcement = `Moved ${cardName(head)} to ${locationName(location, column)}.`;
  }
  return {
    cards,
    selectedKey: null,
    dealing: prev.dealing,
    focusKey: runKeys[0],
    history: [...prev.history, cloneCardMap(prev.cards)],
    announcement,
  };
};

const withAnnouncement = (state: GameState, announcement: string): GameState => ({
  ...state,
  announcement,
});

// Sends a lone card to the first foundation that legally accepts it. Returns the
// moved state on success, or null when no foundation can take the card (e.g. it
// is not a single card, or no suit/rank match exists).
const sendToFoundation = (state: GameState, cardKey: string): GameState | null => {
  const { cards } = state;
  // A card already on a foundation should never hop to another one (every empty
  // foundation would accept a stray ace, etc.).
  if (cards[cardKey].location === "foundation") return null;
  const board = buildBoard(cards);
  if (getCascadeRun(cards, board, cardKey).length > 1) return null;
  for (let column = 0; column < 4; column++) {
    const next = tryStackOnFoundation(cards, board, cardKey, column);
    if (next) return movedCard(state, next, cardKey, "foundation", column);
  }
  return null;
};

// Sends a single accessible card home as one step of the endgame auto-complete.
// Per-card focus and announcements are intentionally suppressed (only the final
// win is announced) so the rapid sequence doesn't spam screen readers. Returns
// the unchanged state when nothing can go home, which halts the driving timer.
const autoFoundationStep = (state: GameState): GameState => {
  const board = buildBoard(state.cards);
  const move = nextAutoFoundationMove(state.cards, board);
  if (!move) return state;
  const cards = tryStackOnFoundation(state.cards, board, move.cardKey, move.column)!;
  return {
    ...state,
    cards,
    selectedKey: null,
    focusKey: null,
    history: [...state.history, cloneCardMap(state.cards)],
    announcement: hasWon(cards) ? WIN_ANNOUNCEMENT : "",
  };
};

// Clicking a card: select, deselect, auto-send to foundation, or attempt a move
// onto the clicked destination card.
const selectCard = (state: GameState, cardKey: string): GameState => {
  const { cards, selectedKey } = state;
  const board = buildBoard(cards);

  // Re-clicking the selected card: try to send a lone card to any foundation,
  // otherwise deselect the whole run.
  if (selectedKey && selectedKey === cardKey) {
    const sent = sendToFoundation(state, selectedKey);
    if (sent) return sent;
    return {
      ...state,
      selectedKey: null,
      announcement: `Deselected ${cardName(cards[cardKey])}.`,
    };
  }

  // Nothing selected yet: pick up this card (or its run).
  if (!selectedKey) {
    const clicked = cards[cardKey];
    if (clicked.location === "cascade") {
      const run = getCascadeRun(cards, board, cardKey);
      if (!isValidSequence(cards, run)) {
        return withAnnouncement(
          state,
          `${cardName(clicked)} is not the top of a movable sequence.`,
        );
      }
      return {
        ...state,
        selectedKey: cardKey,
        announcement:
          run.length > 1
            ? `Selected ${run.length} cards from ${cardName(clicked)}. Choose where to move them.`
            : `Selected ${cardName(clicked)}. Choose where to move it.`,
      };
    }
    return {
      ...state,
      selectedKey: cardKey,
      announcement: `Selected ${cardName(clicked)}. Choose where to move it.`,
    };
  }

  // A card is already selected and a different card was clicked: attempt a move
  // onto that destination card.
  const movingCard = cards[selectedKey];
  const destCard = cards[cardKey];
  const runKeys = getCascadeRun(cards, board, selectedKey);

  if (destCard.location === "foundation") {
    if (runKeys.length > 1) {
      return withAnnouncement(state, `Only a single card can move to a foundation.`);
    }
    const column = destCard.column!;
    const next = tryStackOnFoundation(cards, board, selectedKey, column);
    if (!next) {
      return withAnnouncement(
        state,
        `${cardName(movingCard)} cannot move to foundation ${column + 1}.`,
      );
    }
    return movedCard(state, next, selectedKey, "foundation", column);
  }

  if (destCard.location === "cascade") {
    const column = destCard.column!;
    const destIsEmpty = board.cascades[column].length === 0;
    if (runKeys.length > maxMovableCards(board, destIsEmpty)) {
      return withAnnouncement(
        state,
        `Not enough free cells or empty columns to move ${runKeys.length} cards at once.`,
      );
    }
    const next = tryMoveRunToCascade(cards, board, runKeys, column);
    if (!next) {
      return withAnnouncement(
        state,
        `${cardName(movingCard)} cannot move to tableau column ${column + 1}.`,
      );
    }
    return movedRun(state, next, runKeys, "cascade", column);
  }

  // Destination is an occupied free cell: nothing to do.
  return state;
};

// Clicking an empty slot while a card is selected: attempt to move there.
const selectEmpty = (state: GameState, location: string): GameState => {
  const { cards, selectedKey } = state;
  if (!selectedKey) return state;

  const match = location.match(/(\w+)(\d+)/);
  if (!match) return state;
  const locationType = match[1];
  const column = Number(match[2]);

  const board = buildBoard(cards);
  const runKeys = getCascadeRun(cards, board, selectedKey);

  if (locationType === "foundation") {
    if (runKeys.length > 1) {
      return withAnnouncement(state, `Only a single card can move to a foundation.`);
    }
    const next = tryStackOnFoundation(cards, board, selectedKey, column);
    if (!next) {
      return withAnnouncement(
        state,
        `${cardName(cards[selectedKey])} cannot move to foundation ${column + 1}.`,
      );
    }
    return movedCard(state, next, selectedKey, "foundation", column);
  }

  if (locationType === "freeCell") {
    if (runKeys.length > 1) {
      return withAnnouncement(state, `Only a single card can move to a free cell.`);
    }
    if (board.freeCells[column] !== null) {
      return withAnnouncement(state, `Free cell ${column + 1} is occupied.`);
    }
    const next = moveToFreeCell(cards, selectedKey, column);
    return movedCard(state, next, selectedKey, "freeCell", column);
  }

  if (locationType === "cascade") {
    const next = tryMoveRunToCascade(cards, board, runKeys, column);
    if (!next) {
      return withAnnouncement(
        state,
        `${cardName(cards[selectedKey])} cannot move to tableau column ${column + 1}.`,
      );
    }
    return movedRun(state, next, runKeys, "cascade", column);
  }

  return state;
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "DEAL":
      return {
        cards: action.cards,
        selectedKey: null,
        announcement: "",
        dealing: true,
        focusKey: null,
        history: [],
      };
    case "END_DEAL":
      return state.dealing ? { ...state, dealing: false } : state;
    case "SELECT_CARD":
      return selectCard(state, action.cardKey);
    case "SELECT_EMPTY":
      return selectEmpty(state, action.location);
    case "DROP":
      // Reuse the click-to-move logic by treating the dragged card as the
      // current selection, then resolving the move against the drop location.
      return selectEmpty({ ...state, selectedKey: action.fromKey }, action.location);
    case "SEND_TO_FOUNDATION":
      // Double-click shortcut: silently no-op when no foundation accepts the
      // card so a redundant trailing event (after a real double-click) is inert.
      return sendToFoundation(state, action.cardKey) ?? state;
    case "AUTO_FOUNDATION_STEP":
      return autoFoundationStep(state);
    case "UNDO": {
      if (state.history.length === 0) return state;
      const history = state.history.slice(0, -1);
      const cards = state.history[state.history.length - 1];
      return {
        ...state,
        cards,
        selectedKey: null,
        focusKey: null,
        history,
        announcement: "Undo.",
      };
    }
    default:
      return state;
  }
}

import { createSeededRandom } from "./seed";
import type { Board, Card, CardColor, LocationType, Suit } from "./types";

export const SUITS: Suit[] = ["♣", "♦", "♥", "♠"];

export const TOTAL_CARDS = 52;

const RANK_NAMES = [
  "Ace",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Jack",
  "Queen",
  "King",
];

const SUIT_NAMES: Record<Suit, string> = {
  "♣": "Clubs",
  "♦": "Diamonds",
  "♥": "Hearts",
  "♠": "Spades",
};

export type CardMap = Record<string, Card>;

export const cardName = (card: Pick<Card, "rank" | "suit">) =>
  `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;

export const locationName = (location: string, column: number) => {
  const col = Number(column) + 1;
  if (location === "foundation") return `foundation ${col}`;
  if (location === "freeCell") return `free cell ${col}`;
  if (location === "cascade") return `tableau column ${col}`;
  return location;
};

export const getCardColor = (card: { suit: Suit }): CardColor =>
  card.suit === "♦" || card.suit === "♥" ? "red" : "black";

// A fresh, unshuffled 52-card deck keyed by `${rank}${suit}`.
export const createDeck = (): CardMap => {
  const cards: CardMap = {};
  SUITS.forEach((suit) => {
    for (let rank = 0; rank <= 12; rank++) {
      const objKey = rank + suit;
      cards[objKey] = { suit, rank, location: null, objKey };
    }
  });
  return cards;
};

// Shuffles a fresh deck and deals it across the eight cascades. `random` is
// injectable so tests can produce deterministic deals.
export const shuffleAndDealWithSeed = (seed: number): CardMap =>
  shuffleAndDeal(createSeededRandom(seed));

export const shuffleAndDeal = (random: () => number = Math.random): CardMap => {
  const deck = createDeck();
  const order = Object.keys(deck)
    .map((key) => ({ sortValue: random(), key }))
    .sort((a, b) => a.sortValue - b.sortValue)
    .map((entry) => entry.key);

  const cards: CardMap = {};
  order.forEach((key, i) => {
    cards[key] = {
      ...deck[key],
      location: "cascade",
      column: i % 8,
      position: Math.floor(i / 8),
    };
  });
  return cards;
};

// Derives the denormalized board (cascades/foundations/free cells) from the
// single source of truth. Computed on demand; never stored in state.
export const buildBoard = (cards: CardMap): Board => {
  const cascades: Card[][] = [[], [], [], [], [], [], [], []];
  const foundations: Card[][] = [[], [], [], []];
  const freeCells: (Card | null)[] = [null, null, null, null];
  for (const key in cards) {
    const card = cards[key];
    if (card.location === "cascade") cascades[card.column!][card.position!] = card;
    else if (card.location === "foundation") foundations[card.column!][card.position!] = card;
    else if (card.location === "freeCell") freeCells[card.column!] = card;
  }
  return { cascades, foundations, freeCells };
};

// Assigns a deal-animation stagger index to every currently-rendered card so a
// deal (or a resumed game) flies its cards in one after another. Cascade cards
// are dealt row by row across the columns first, then free cells, then the
// visible top foundation cards. For a freshly dealt board (everything in the
// cascades) this reproduces the original deal order.
export const dealOrder = (board: Board): Record<string, number> => {
  const order: string[] = [];
  const maxHeight = board.cascades.reduce((max, col) => Math.max(max, col.length), 0);
  for (let position = 0; position < maxHeight; position++) {
    for (let column = 0; column < board.cascades.length; column++) {
      const card = board.cascades[column][position];
      if (card) order.push(card.objKey);
    }
  }
  board.freeCells.forEach((card) => {
    if (card) order.push(card.objKey);
  });
  board.foundations.forEach((foundation) => {
    const top = foundation[foundation.length - 1];
    if (top) order.push(top.objKey);
  });

  const indexByKey: Record<string, number> = {};
  order.forEach((key, i) => {
    indexByKey[key] = i;
  });
  return indexByKey;
};

// The game is won once the entire deck has reached the foundations.
export const hasWon = (cards: CardMap): boolean => {
  const keys = Object.keys(cards);
  return keys.length === TOTAL_CARDS && keys.every((key) => cards[key].location === "foundation");
};

// Ordered list of card keys that move together when `cardKey` is picked up. For
// a cascade card that is the run from it down to the bottom of its column;
// anywhere else it is just the single card.
export const getCascadeRun = (cards: CardMap, board: Board, cardKey: string): string[] => {
  const card = cards[cardKey];
  if (!card || card.location !== "cascade") return [cardKey];
  const cascade = board.cascades[card.column!];
  const startIdx = cascade.findIndex((c) => c.objKey === cardKey);
  if (startIdx === -1) return [cardKey];
  return cascade.slice(startIdx).map((c) => c.objKey);
};

// A legal tableau sequence: each card one rank lower than the one above it and
// alternating in color.
export const isValidSequence = (cards: CardMap, cardKeys: string[]): boolean => {
  for (let i = 0; i < cardKeys.length - 1; i++) {
    const upper = cards[cardKeys[i]];
    const lower = cards[cardKeys[i + 1]];
    if (lower.rank !== upper.rank - 1) return false;
    if (getCardColor(lower) === getCardColor(upper)) return false;
  }
  return true;
};

// Maximum number of cards movable as a unit: (free cells + 1) * 2 ^ (empty
// columns). An empty destination column does not count toward the multiplier.
export const maxMovableCards = (board: Board, destColumnIsEmpty: boolean): number => {
  const freeCells = board.freeCells.filter((cell) => cell === null).length;
  let emptyCascades = board.cascades.filter((cascade) => cascade.length === 0).length;
  if (destColumnIsEmpty && emptyCascades > 0) emptyCascades -= 1;
  return (freeCells + 1) * Math.pow(2, emptyCascades);
};

// Immutably writes a single card to a new location, returning a new card map.
const placeCard = (
  cards: CardMap,
  cardKey: string,
  location: LocationType,
  column: number,
  position: number,
): CardMap => ({
  ...cards,
  [cardKey]: { ...cards[cardKey], location, column, position },
});

// Immutably writes an ordered run to a new location, re-indexing positions from
// `basePosition`.
const placeRun = (
  cards: CardMap,
  runKeys: string[],
  location: LocationType,
  column: number,
  basePosition: number,
): CardMap => {
  const next: CardMap = { ...cards };
  runKeys.forEach((key, i) => {
    next[key] = { ...next[key], location, column, position: basePosition + i };
  });
  return next;
};

// Attempts to stack a single card on a foundation. Returns the new card map on
// success, or null if the move is illegal.
export const tryStackOnFoundation = (
  cards: CardMap,
  board: Board,
  cardKey: string,
  column: number,
): CardMap | null => {
  const cardToMove = cards[cardKey];
  const foundation = board.foundations[column];
  if (foundation.length === 0) {
    if (cardToMove.rank !== 0) return null;
  } else {
    const top = foundation[foundation.length - 1];
    if (cardToMove.suit !== top.suit) return null;
    if (cardToMove.rank - 1 !== top.rank) return null;
  }
  return placeCard(cards, cardKey, "foundation", column, cardToMove.rank);
};

// Moves a single card to a (presumed empty) free cell.
export const moveToFreeCell = (cards: CardMap, cardKey: string, column: number): CardMap =>
  placeCard(cards, cardKey, "freeCell", column, 0);

// Attempts to move a run onto a cascade column, enforcing both the tableau
// stacking rule for the head card and the max-movable-cards limit. Returns the
// new card map on success, or null if the move is illegal.
export const tryMoveRunToCascade = (
  cards: CardMap,
  board: Board,
  runKeys: string[],
  column: number,
): CardMap | null => {
  const cascade = board.cascades[column];
  const destIsEmpty = cascade.length === 0;
  if (runKeys.length > maxMovableCards(board, destIsEmpty)) return null;
  const head = cards[runKeys[0]];
  if (!destIsEmpty) {
    const top = cascade[cascade.length - 1];
    if (getCardColor(head) === getCardColor(top)) return null;
    if (head.rank + 1 !== top.rank) return null;
  }
  return placeRun(cards, runKeys, "cascade", column, cascade.length);
};

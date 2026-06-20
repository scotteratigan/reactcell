export type Suit = "♣" | "♦" | "♥" | "♠";

export type CardColor = "red" | "black";

export type LocationType = "cascade" | "foundation" | "freeCell";

export interface Card {
  suit: Suit;
  rank: number;
  location: LocationType | null;
  objKey: string;
  column?: number;
  position?: number;
  // Selection is derived from the current selection at render time and attached
  // to display copies only; it is never part of the stored game state.
  selected?: boolean;
  // Like `selected`, derived at render time: true while this card is part of the
  // run currently being dragged. Never part of the stored game state.
  dragging?: boolean;
}

// Denormalized view of the board, derived from the card map. This is never
// stored in state, only computed from `cards` when needed.
export interface Board {
  cascades: Card[][];
  foundations: Card[][];
  freeCells: (Card | null)[];
}

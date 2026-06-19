export type Suit = "♣" | "♦" | "♥" | "♠";

export type CardColor = "red" | "black";

export type LocationType = "cascade" | "foundation" | "freeCell";

export interface Card {
  suit: Suit;
  rank: number;
  location: LocationType | null;
  selected: boolean;
  objKey: string;
  column?: number;
  position?: number;
}

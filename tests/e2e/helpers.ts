import { expect, type Page } from "@playwright/test";

export const CARD_NAME = /of (Clubs|Diamonds|Hearts|Spades)$/;

export interface BoardCard {
  objKey: string;
  rank: number;
  suit: string;
  label: string | null;
}

export type Board = BoardCard[][];

export interface TwoCardRunPlan {
  low: BoardCard;
  head: BoardCard;
  dest: BoardCard;
  destCol: number;
}

// The deal renders all 52 cards in one update. Each of the 8 tableau columns
// always exposes at least its bottom card as a button; columns that happen to
// be dealt with a run at the bottom expose more, so we wait for "at least 8".
export async function waitForDeal(page: Page): Promise<void> {
  await expect
    .poll(() => page.getByRole("button", { name: CARD_NAME }).count())
    .toBeGreaterThanOrEqual(8);
}

export async function startRandomGame(page: Page): Promise<void> {
  await page.getByRole("button", { name: "New Game" }).click();
  await page.getByRole("button", { name: "Random game" }).click();
  await waitForDeal(page);
}

// Reads the live tableau as an array of 8 columns, each an ordered (top -> bottom)
// list of { objKey, rank, suit, label } derived from the rendered card nodes.
export async function readBoard(page: Page): Promise<Board> {
  return page.evaluate((): Board => {
    const group = document.querySelector('[aria-label="Tableau columns"]');
    if (!group) return [];

    const columns = Array.from(group.children);
    return columns.map((col) =>
      Array.from(col.querySelectorAll('[id^="card-"]')).map((node) => {
        const objKey = node.id.replace("card-", "");
        const suit = objKey.slice(-1);
        const rank = parseInt(objKey.slice(0, -1), 10);
        return { objKey, rank, suit, label: node.getAttribute("aria-label") };
      }),
    );
  });
}

export const color = (card: BoardCard): "red" | "black" =>
  card.suit === "♦" || card.suit === "♥" ? "red" : "black";

// True when `lower` may sit directly beneath `upper` in a tableau run.
export const stacks = (upper: BoardCard, lower: BoardCard): boolean =>
  lower.rank === upper.rank - 1 && color(upper) !== color(lower);

// A column bottom whose move is a single card (it does not head a longer run),
// so it behaves like the classic one-card selection. Returns null if none.
export function findSingleBottomCard(board: Board): BoardCard | null {
  for (const col of board) {
    if (!col.length) continue;
    if (col.length === 1) return col[0];
    const bottom = col[col.length - 1];
    const above = col[col.length - 2];
    if (!stacks(above, bottom)) return bottom;
  }
  return null;
}

// Finds columns (i, j, k) that let us construct and then relocate a two-card run:
//  1. move the single bottom card of column i onto the bottom of column j
//     (building a 2-card run headed by j's old bottom card), then
//  2. move that 2-card run onto the bottom card of column k.
// Returns the relevant cards, or null when no such arrangement exists.
export function findTwoCardRunPlan(board: Board): TwoCardRunPlan | null {
  const bottoms = board.map((col) => (col.length ? col[col.length - 1] : null));
  const headsSingle = (idx: number): boolean => {
    const col = board[idx];
    return col.length === 1 || !stacks(col[col.length - 2], col[col.length - 1]);
  };
  for (let i = 0; i < 8; i++) {
    if (!bottoms[i] || !headsSingle(i)) continue;
    for (let j = 0; j < 8; j++) {
      if (i === j || !bottoms[j]) continue;
      const low = bottoms[i]!;
      const head = bottoms[j]!;
      if (!stacks(head, low)) continue;
      for (let k = 0; k < 8; k++) {
        if (k === i || k === j || !bottoms[k]) continue;
        if (stacks(bottoms[k]!, head)) {
          return { low, head, dest: bottoms[k]!, destCol: k + 1 };
        }
      }
    }
  }
  return null;
}

import { expect, test } from "@playwright/test";
import { findSingleBottomCard, readBoard, waitForDeal } from "./helpers";

// Flattens the tableau into a stable, comparable signature of where every card
// sits, so we can assert a board is the same one (resumed) rather than re-dealt.
const signature = (board: { objKey: string }[][]) =>
  board.map((col) => col.map((card) => card.objKey).join(",")).join("|");

test.describe("persistence", () => {
  test("resumes the same board after a page reload", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);
    const before = signature(await readBoard(page));

    await page.reload();
    await waitForDeal(page);
    const after = signature(await readBoard(page));

    expect(after).toBe(before);
  });

  test("persists a move across a reload", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    const board = await readBoard(page);
    const card = findSingleBottomCard(board);
    expect(card, "expected a single-card tableau bottom to move").not.toBeNull();
    const name = card!.label!;

    // Move the card into the first free cell.
    await page.getByRole("button", { name, exact: true }).press("Enter");
    await page.getByRole("button", { name: `Move ${name} to free cell 1` }).press("Enter");
    await expect(page.locator("[aria-live]")).toHaveText(
      new RegExp(`Moved ${name} to free cell 1\\.`),
    );

    await page.reload();
    await waitForDeal(page);

    // The moved card is still in free cell 1 (exposed as a button with its name),
    // and no longer sits at the bottom of its old column.
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    const resumed = await readBoard(page);
    expect(resumed.some((col) => col.some((c) => c.objKey === card!.objKey))).toBe(false);
  });

  test("New Game replaces the saved game", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);
    const first = signature(await readBoard(page));

    // Deal until we get a board that differs (a shuffle almost never repeats).
    let next = first;
    for (let attempt = 0; attempt < 5 && next === first; attempt++) {
      await page.getByRole("button", { name: "New Game" }).click();
      await waitForDeal(page);
      next = signature(await readBoard(page));
    }
    expect(next).not.toBe(first);

    await page.reload();
    await waitForDeal(page);
    expect(signature(await readBoard(page))).toBe(next);
  });
});

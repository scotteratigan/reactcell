import { expect, test } from "@playwright/test";
import { readBoard, waitForDeal } from "./helpers";

const signature = (board: { objKey: string }[][]) =>
  board.map((col) => col.map((card) => card.objKey).join(",")).join("|");

test.describe("game numbers", () => {
  test("uses the game number from the URL for a fresh visit", async ({ page }) => {
    await page.goto("/?game=8675309");
    await waitForDeal(page);
    const deal = signature(await readBoard(page));

    await page.evaluate(() => localStorage.clear());
    await page.goto("/?game=8675309");
    await waitForDeal(page);

    expect(signature(await readBoard(page))).toBe(deal);
    await expect(page).toHaveURL(/game=8675309/);
  });

  test("shows the current game number on screen", async ({ page }) => {
    await page.goto("/?game=424242");
    await waitForDeal(page);
    await expect(page.getByText("Game number:")).toContainText("424242");
  });

  test("starts a game from a custom game number in the dialog", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    await page.getByRole("button", { name: "New Game" }).click();
    await page.getByLabel("Or enter a game number:").fill("8675309");
    await page.getByRole("button", { name: "Play game number" }).click();
    await waitForDeal(page);

    await expect(page).toHaveURL(/game=8675309/);
    await expect(page.getByText("Game number:")).toContainText("8675309");
  });
});

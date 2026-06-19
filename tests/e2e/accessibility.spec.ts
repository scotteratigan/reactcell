import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { CARD_NAME, findSingleBottomCard, readBoard, waitForDeal, type BoardCard } from "./helpers";

// Returns a tableau bottom card whose move is a single card (not a run head),
// so it exercises the classic one-card selection/move behavior.
async function singleCard(page: Page): Promise<{ locator: Locator; name: string }> {
  const board = await readBoard(page);
  const card = findSingleBottomCard(board);
  expect(card, "expected at least one single-card tableau bottom").not.toBeNull();
  const name = card!.label!;
  return { locator: page.getByRole("button", { name, exact: true }), name };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForDeal(page);
});

test.describe("accessibility", () => {
  test("has no automatically detectable axe violations on load", async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("exposes the bottom card of each tableau column as a named button", async ({ page }) => {
    // Every column's bottom card is selectable. (Columns dealt with a run at the
    // bottom expose additional movable cards, so the total can exceed 8.)
    const board = await readBoard(page);
    expect(board).toHaveLength(8);
    for (const column of board) {
      expect(column.length).toBeGreaterThan(0);
      const bottom = column[column.length - 1];
      await expect(page.getByRole("button", { name: bottom.label!, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: CARD_NAME })).not.toHaveCount(0);
  });

  test("empty slots are non-interactive board state until a move begins", async ({ page }) => {
    // At rest (no card selected), empty foundations/free cells are announced as
    // board state (role=img), not buttons.
    for (let i = 1; i <= 4; i++) {
      await expect(page.getByRole("img", { name: `Foundation ${i}, empty` })).toBeAttached();
      await expect(page.getByRole("img", { name: `Free cell ${i}, empty` })).toBeAttached();
      await expect(page.getByRole("button", { name: `Foundation ${i}, empty` })).toHaveCount(0);
    }

    // Once a card is selected, those empty slots become operable move targets
    // that describe what activating them will do.
    const { locator, name } = await singleCard(page);
    await locator.press("Enter");

    await expect(page.getByRole("button", { name: `Move ${name} to free cell 1` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Move ${name} to foundation 1` })).toBeVisible();
    // They are no longer plain board state while the move is in progress.
    await expect(page.getByRole("img", { name: "Free cell 1, empty" })).toHaveCount(0);
  });

  test("buried cards are not in the tab order", async ({ page }) => {
    // Covered cards are exposed as images, never as buttons.
    const coveredCards = page.getByRole("img", { name: /, covered$/ });
    await expect(coveredCards.first()).toBeAttached();
    const focusableCovered = await page
      .locator('[role="img"][aria-label$="covered"][tabindex="0"]')
      .count();
    expect(focusableCovered).toBe(0);
  });

  test("provides screen-reader instructions and labelled regions", async ({ page }) => {
    await expect(page.getByRole("main", { name: "FreeCell game board" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Foundations" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Free cells" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Tableau columns" })).toBeVisible();
    await expect(page.getByText(/press Enter or Space to select it/)).toBeAttached();
  });
});

test.describe("keyboard play", () => {
  test("selects a card with the keyboard and announces it", async ({ page }) => {
    const { locator: card, name } = await singleCard(page);

    await card.press("Enter");

    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[aria-live]")).toHaveText(
      new RegExp(`Selected ${name}\\. Choose where to move it\\.`),
    );
  });

  test("moves a selected card to a free cell and keeps focus on it", async ({ page }) => {
    const { locator: card, name } = await singleCard(page);

    await card.press("Enter");
    await page.getByRole("button", { name: `Move ${name} to free cell 1` }).press(" ");

    await expect(page.locator("[aria-live]")).toHaveText(
      new RegExp(`Moved ${name} to free cell 1\\.`),
    );
    // Focus follows the card to its new location.
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", name);
  });

  test("announces an illegal move instead of silently ignoring it", async ({ page }) => {
    // Find a single-card tableau bottom that is not an Ace (Aces are the only
    // legal first move to an empty foundation).
    const board = await readBoard(page);
    let target: BoardCard | null = null;
    for (const column of board) {
      if (!column.length) continue;
      const bottom = column[column.length - 1];
      const isSingle =
        column.length === 1 ||
        !(
          bottom.rank === column[column.length - 2].rank - 1 &&
          ["♥", "♦"].includes(bottom.suit) !== ["♥", "♦"].includes(column[column.length - 2].suit)
        );
      if (isSingle && bottom.rank !== 0) {
        target = bottom;
        break;
      }
    }
    expect(target, "expected a non-Ace single-card bottom").not.toBeNull();

    await page.getByRole("button", { name: target!.label!, exact: true }).press("Enter");
    await page
      .getByRole("button", { name: `Move ${target!.label!} to foundation 1` })
      .press("Enter");

    await expect(page.locator("[aria-live]")).toHaveText(/cannot move to foundation 1\./);
  });
});

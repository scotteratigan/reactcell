import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const CARD_NAME = /of (Clubs|Diamonds|Hearts|Spades)$/;

// Wait until the deck has been dealt (one selectable top card per column).
async function waitForDeal(page) {
  await expect(page.getByRole("button", { name: CARD_NAME })).toHaveCount(8);
}

// Returns the first selectable tableau card button.
function firstCard(page) {
  return page.getByRole("button", { name: CARD_NAME }).first();
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

  test("exposes the top card of each tableau column as a named button", async ({ page }) => {
    // Each of the 8 tableau columns exposes exactly one interactive (top) card button.
    await expect(page.getByRole("button", { name: CARD_NAME })).toHaveCount(8);
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
    const name = await firstCard(page).getAttribute("aria-label");
    await firstCard(page).press("Enter");

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
    const card = firstCard(page);
    const name = await card.getAttribute("aria-label");

    await card.press("Enter");

    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[aria-live]")).toHaveText(
      new RegExp(`Selected ${name}\\. Choose where to move it\\.`),
    );
  });

  test("moves a selected card to a free cell and keeps focus on it", async ({ page }) => {
    const card = firstCard(page);
    const name = await card.getAttribute("aria-label");

    await card.press("Enter");
    await page.getByRole("button", { name: `Move ${name} to free cell 1` }).press(" ");

    await expect(page.locator("[aria-live]")).toHaveText(
      new RegExp(`Moved ${name} to free cell 1\\.`),
    );
    // Focus follows the card to its new location.
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", name);
  });

  test("announces an illegal move instead of silently ignoring it", async ({ page }) => {
    // Find a tableau top card that is not an Ace (Aces are the only legal first
    // move to an empty foundation).
    const cards = page.getByRole("button", { name: CARD_NAME });
    const count = await cards.count();
    let nonAce = null;
    let name = null;
    for (let i = 0; i < count; i++) {
      const label = await cards.nth(i).getAttribute("aria-label");
      if (!label.startsWith("Ace")) {
        nonAce = cards.nth(i);
        name = label;
        break;
      }
    }
    expect(nonAce).not.toBeNull();

    await nonAce.press("Enter");
    await page.getByRole("button", { name: `Move ${name} to foundation 1` }).press("Enter");

    await expect(page.locator("[aria-live]")).toHaveText(/cannot move to foundation 1\./);
  });
});

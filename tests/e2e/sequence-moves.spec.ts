import { expect, test } from "@playwright/test";
import {
  findTwoCardRunPlan,
  gameAnnouncement,
  readBoard,
  startRandomGame,
  waitForDeal,
  type TwoCardRunPlan,
} from "./helpers";

test.describe("multi-card sequence moves", () => {
  test("builds a two-card run and moves it as a unit between columns", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    // The deal is random, so keep dealing until we get a board that allows us to
    // construct a two-card run and then relocate it (almost always immediate).
    let plan: TwoCardRunPlan | null = null;
    for (let attempt = 0; attempt < 40 && !plan; attempt++) {
      plan = findTwoCardRunPlan(await readBoard(page));
      if (!plan) {
        await startRandomGame(page);
      }
    }
    expect(plan, "expected a board permitting a constructible two-card run").not.toBeNull();

    const card = (label: string) => page.getByRole("button", { name: label, exact: true });
    const live = gameAnnouncement(page);

    // 1. Stack the low card onto the head card to form a 2-card run.
    await card(plan!.low.label!).press("Enter");
    await card(plan!.head.label!).press("Enter");
    await expect(live).toHaveText(
      new RegExp(`Moved ${plan!.low.label!} to tableau column \\d+\\.`),
    );

    // 2. Select the run by its head. It is no longer the bottom card, yet it is
    //    still a focusable button because it heads a legal sequence.
    const head = card(plan!.head.label!);
    await expect(head).toBeVisible();
    await head.press("Enter");
    await expect(live).toHaveText(new RegExp(`Selected 2 cards from ${plan!.head.label!}\\.`));

    // 3. Drop the whole run onto the destination column.
    await card(plan!.dest.label!).press("Enter");
    await expect(live).toHaveText(
      new RegExp(`Moved 2 cards from ${plan!.head.label!} to tableau column ${plan!.destCol}\\.`),
    );

    // The run now sits on the destination column: the head's bottom partner (low)
    // follows it there as the new bottom card.
    const board = await readBoard(page);
    const destColumn = board[plan!.destCol - 1];
    expect(destColumn[destColumn.length - 1].label).toBe(plan!.low.label);
    expect(destColumn[destColumn.length - 2].label).toBe(plan!.head.label);
  });

  test("refuses to move a multi-card run onto a free cell", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    let plan: TwoCardRunPlan | null = null;
    for (let attempt = 0; attempt < 40 && !plan; attempt++) {
      plan = findTwoCardRunPlan(await readBoard(page));
      if (!plan) {
        await startRandomGame(page);
      }
    }
    expect(plan).not.toBeNull();

    const card = (label: string) => page.getByRole("button", { name: label, exact: true });
    const live = gameAnnouncement(page);

    // Build the 2-card run, then select it and try to send it to a free cell.
    await card(plan!.low.label!).press("Enter");
    await card(plan!.head.label!).press("Enter");
    await card(plan!.head.label!).press("Enter");
    await expect(live).toHaveText(new RegExp(`Selected 2 cards from ${plan!.head.label!}\\.`));

    await page
      .getByRole("button", { name: `Move ${plan!.head.label!} to free cell 1` })
      .press("Enter");
    await expect(live).toHaveText(/Only a single card can move to a free cell\./);
  });
});

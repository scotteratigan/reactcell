import { expect, test, type Page } from "@playwright/test";
import {
  findSingleBottomCard,
  findTwoCardRunPlan,
  gameAnnouncement,
  readBoard,
  startRandomGame,
  waitForDeal,
  type Board,
  type BoardCard,
  type TwoCardRunPlan,
} from "./helpers";

// Drives a pointer drag from a card to a drop zone. Playwright's mouse input
// produces trusted pointer events, which is what the drag layer listens for.
async function dragCardToZone(page: Page, fromObjKey: string, dropSelector: string): Promise<void> {
  const source = page.locator(`[data-card-key="${fromObjKey}"]`).last();
  const target = page.locator(dropSelector).first();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("drag source or target not found");

  const sx = from.x + from.width / 2;
  const sy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // Move past the drag threshold first, then travel to the target in steps so
  // the hover hit-testing runs along the way.
  await page.mouse.move(sx + 12, sy + 12, { steps: 3 });
  await page.mouse.move(tx, ty, { steps: 10 });
  await page.mouse.up();
}

// The deal flies cards in from above; mid-animation a card's transform can
// transiently overlap other slots, which would skew pointer hit-testing. Wait
// for the deal animation to finish before driving a drag.
async function settleDeal(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('[class*="dealing"]'));
}

const findExposedAce = (board: Board): BoardCard | null => {
  for (const col of board) {
    if (col.length && col[col.length - 1].rank === 0) return col[col.length - 1];
  }
  return null;
};

test.describe("drag and drop", () => {
  test("drags a single card into an empty free cell", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    let bottom: BoardCard | null = null;
    for (let attempt = 0; attempt < 40 && !bottom; attempt++) {
      bottom = findSingleBottomCard(await readBoard(page));
      if (!bottom) await startRandomGame(page);
    }
    expect(bottom, "expected an exposed single bottom card").not.toBeNull();

    await settleDeal(page);
    const live = gameAnnouncement(page);
    await dragCardToZone(page, bottom!.objKey, '[data-drop-location="freeCell0"]');

    await expect(live).toHaveText(new RegExp(`Moved ${bottom!.label!} to free cell 1\\.`));
  });

  test("drags a card onto another column to build a run", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    let plan: TwoCardRunPlan | null = null;
    for (let attempt = 0; attempt < 40 && !plan; attempt++) {
      plan = findTwoCardRunPlan(await readBoard(page));
      if (!plan) await startRandomGame(page);
    }
    expect(plan, "expected a board permitting a constructible two-card run").not.toBeNull();

    await settleDeal(page);
    const live = gameAnnouncement(page);
    // Drop the low card onto the head card; the card sits inside its column's
    // drop zone, so the move resolves to that tableau column.
    await dragCardToZone(page, plan!.low.objKey, `[data-card-key="${plan!.head.objKey}"]`);

    await expect(live).toHaveText(
      new RegExp(`Moved ${plan!.low.label!} to tableau column \\d+\\.`),
    );

    const board = await readBoard(page);
    const headCol = board.find((col) => col.some((c) => c.objKey === plan!.head.objKey));
    expect(headCol).toBeTruthy();
    expect(headCol![headCol!.length - 1].objKey).toBe(plan!.low.objKey);
  });

  test("double-click sends an exposed ace to a foundation", async ({ page }) => {
    await page.goto("/");
    await waitForDeal(page);

    let ace: BoardCard | null = null;
    for (let attempt = 0; attempt < 60 && !ace; attempt++) {
      ace = findExposedAce(await readBoard(page));
      if (!ace) await startRandomGame(page);
    }
    expect(ace, "expected an exposed ace at a column bottom").not.toBeNull();

    await settleDeal(page);
    const live = gameAnnouncement(page);
    await page.locator(`[data-card-key="${ace!.objKey}"]`).last().dblclick();

    await expect(live).toHaveText(new RegExp(`Moved ${ace!.label!} to foundation \\d+\\.`));
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import FreeCell, { type FreeCellProps } from "../../src/FreeCell";
import { cleanupRender, type RenderedResult, renderIntoDocument } from "../testUtils";

let rendered: RenderedResult | null = null;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderFreeCell(props: Partial<FreeCellProps> = {}): HTMLElement {
  rendered = renderIntoDocument(
    <FreeCell
      location="freeCell2"
      card={null}
      selectCardFn={() => {}}
      selectEmptySquareFn={() => {}}
      {...props}
    />,
  );

  return rendered.container.firstChild as HTMLElement;
}

describe("FreeCell", () => {
  it("selects its empty square location when empty", () => {
    const selectEmptySquareFn = vi.fn<(location: string) => void>();
    const cell = renderFreeCell({ selectEmptySquareFn });

    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectEmptySquareFn).toHaveBeenCalledWith("freeCell2");
  });

  it("renders and selects its card when occupied", () => {
    const selectCardFn = vi.fn<(objKey: string) => void>();
    const selectEmptySquareFn = vi.fn<(location: string) => void>();
    const cell = renderFreeCell({
      card: { rank: 10, suit: "♦", selected: false, location: "freeCell", objKey: "10♦" },
      selectCardFn,
      selectEmptySquareFn,
    });

    expect(cell.textContent).toBe("J♦♦J♦");

    (cell.firstChild as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("10♦");
    expect(selectEmptySquareFn).not.toHaveBeenCalled();
  });
});

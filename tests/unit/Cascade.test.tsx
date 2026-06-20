import { afterEach, describe, expect, it, vi } from "vitest";
import Cascade, { type CascadeProps } from "../../src/Cascade";
import { cleanupRender, type RenderedResult, renderIntoDocument } from "../testUtils";

let rendered: RenderedResult | null = null;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderCascade(props: Partial<CascadeProps> = {}): HTMLElement {
  rendered = renderIntoDocument(
    <Cascade
      location="cascade3"
      cards={[]}
      selectCardFn={() => {}}
      selectEmptySquareFn={() => {}}
      {...props}
    />,
  );

  return rendered.container.firstChild as HTMLElement;
}

describe("Cascade", () => {
  it("selects its empty square location when empty", () => {
    const selectEmptySquareFn = vi.fn<(location: string) => void>();
    const cascade = renderCascade({ selectEmptySquareFn });

    cascade.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectEmptySquareFn).toHaveBeenCalledWith("cascade3");
  });

  it("renders cards in order and selects the clicked card", () => {
    const selectCardFn = vi.fn<(objKey: string) => void>();
    const cascade = renderCascade({
      cards: [
        { rank: 8, suit: "♣", selected: false, location: "cascade", objKey: "8♣" },
        { rank: 7, suit: "♥", selected: true, location: "cascade", objKey: "7♥" },
      ],
      selectCardFn,
    });

    expect(cascade.children).toHaveLength(2);
    expect(cascade.textContent).toBe("9♣♣9♣8♥♥8♥");
    expect((cascade.children[1] as HTMLElement).style.zIndex).toBe("1");

    cascade.children[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("7♥");
  });
});

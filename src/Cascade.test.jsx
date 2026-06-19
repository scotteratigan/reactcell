import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Cascade from "./Cascade";
import { cleanupRender, renderIntoDocument } from "./testUtils";

let rendered;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderCascade(props) {
  rendered = renderIntoDocument(
    <Cascade
      cardWidth={70}
      cardHeight={100}
      cardMargins={10}
      location="cascade3"
      cards={[]}
      selectCardFn={() => {}}
      selectEmptySquareFn={() => {}}
      {...props}
    />,
  );

  return rendered.container.firstChild;
}

describe("Cascade", () => {
  it("selects its empty square location when empty", () => {
    const selectEmptySquareFn = vi.fn();
    const cascade = renderCascade({ selectEmptySquareFn });

    cascade.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectEmptySquareFn).toHaveBeenCalledWith("cascade3");
  });

  it("renders cards in order and selects the clicked card", () => {
    const selectCardFn = vi.fn();
    const cascade = renderCascade({
      cards: [
        { rank: 8, suit: "♣", selected: false },
        { rank: 7, suit: "♥", selected: true },
      ],
      selectCardFn,
    });

    expect(cascade.children).toHaveLength(2);
    expect(cascade.textContent).toBe("♣99♣♥88♥");
    expect(cascade.children[1].style.zIndex).toBe("1");

    cascade.children[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("7♥");
  });
});

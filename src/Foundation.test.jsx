import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Foundation from "./Foundation";
import { cleanupRender, renderIntoDocument } from "./testUtils";

let rendered;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderFoundation(props) {
  rendered = renderIntoDocument(
    <Foundation
      width={70}
      height={100}
      cardMargins={10}
      location="foundation1"
      cards={[]}
      selectCardFn={() => {}}
      selectEmptySquareFn={() => {}}
      {...props}
    />,
  );

  return rendered.container.firstChild;
}

describe("Foundation", () => {
  it("selects its empty square location when empty", () => {
    const selectEmptySquareFn = vi.fn();
    const foundation = renderFoundation({ selectEmptySquareFn });

    foundation.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectEmptySquareFn).toHaveBeenCalledWith("foundation1");
  });

  it("renders only the top foundation card", () => {
    const selectCardFn = vi.fn();
    const foundation = renderFoundation({
      cards: [
        { rank: 0, suit: "♠", selected: false },
        { rank: 1, suit: "♠", selected: true },
      ],
      selectCardFn,
    });

    expect(foundation.textContent).toBe("♠22♠");
    expect(foundation.firstChild.style.border).toBe("2px solid rgb(213, 0, 0)");

    foundation.firstChild.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("1♠");
  });
});

import React from "react";
import ReactDOM from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Foundation from "./Foundation";

let container;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

function renderFoundation(props) {
  container = document.createElement("div");
  document.body.appendChild(container);

  ReactDOM.render(
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
    container
  );

  return container.firstChild;
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
        { rank: 1, suit: "♠", selected: true }
      ],
      selectCardFn
    });

    expect(foundation.textContent).toBe("♠22♠");
    expect(foundation.firstChild.style.border).toBe("2px solid red");

    foundation.firstChild.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("1♠");
  });
});

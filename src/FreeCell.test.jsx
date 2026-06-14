import React from "react";
import ReactDOM from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import FreeCell from "./FreeCell";

let container;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

function renderFreeCell(props) {
  container = document.createElement("div");
  document.body.appendChild(container);

  ReactDOM.render(
    <FreeCell
      width={70}
      height={100}
      cardMargins={10}
      location="freeCell2"
      card={null}
      selectCardFn={() => {}}
      selectEmptySquareFn={() => {}}
      {...props}
    />,
    container
  );

  return container.firstChild;
}

describe("FreeCell", () => {
  it("selects its empty square location when empty", () => {
    const selectEmptySquareFn = vi.fn();
    const cell = renderFreeCell({ selectEmptySquareFn });

    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectEmptySquareFn).toHaveBeenCalledWith("freeCell2");
  });

  it("renders and selects its card when occupied", () => {
    const selectCardFn = vi.fn();
    const selectEmptySquareFn = vi.fn();
    const cell = renderFreeCell({
      card: { rank: 10, suit: "♦", selected: false },
      selectCardFn,
      selectEmptySquareFn
    });

    expect(cell.textContent).toBe("♦JJ♦");

    cell.firstChild.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("10♦");
    expect(selectEmptySquareFn).not.toHaveBeenCalled();
  });
});

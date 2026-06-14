import React from "react";
import ReactDOM from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Cascade from "./Cascade";

let container;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

function renderCascade(props) {
  container = document.createElement("div");
  document.body.appendChild(container);

  ReactDOM.render(
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
    container
  );

  return container.firstChild;
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
        { rank: 7, suit: "♥", selected: true }
      ],
      selectCardFn
    });

    expect(cascade.children).toHaveLength(2);
    expect(cascade.textContent).toBe("♣99♣♥88♥");
    expect(cascade.children[1].style.zIndex).toBe("1");

    cascade.children[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("7♥");
  });
});

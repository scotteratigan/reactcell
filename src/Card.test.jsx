import React from "react";
import ReactDOM from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Card from "./Card";

let container;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

function renderCard(props) {
  container = document.createElement("div");
  document.body.appendChild(container);

  ReactDOM.render(
    <Card
      height={100}
      width={70}
      rank={0}
      suit="♠"
      selectCardFn={() => {}}
      objKey="0♠"
      {...props}
    />,
    container
  );

  return container.firstChild;
}

describe("Card", () => {
  it("renders face values for aces and kings", () => {
    const card = renderCard({ rank: 12, suit: "♥" });

    expect(card.textContent).toBe("♥KK♥");
    expect(card.style.color).toBe("red");
  });

  it("calls selectCardFn with its object key when clicked", () => {
    const selectCardFn = vi.fn();
    const card = renderCard({ objKey: "7♣", selectCardFn });

    card.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("7♣");
  });
});

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Card from "./Card";
import { cleanupRender, renderIntoDocument } from "./testUtils";

let rendered;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderCard(props) {
  rendered = renderIntoDocument(
    <Card
      height={100}
      width={70}
      rank={0}
      suit="♠"
      selectCardFn={() => {}}
      objKey="0♠"
      {...props}
    />,
  );

  return rendered.container.firstChild;
}

describe("Card", () => {
  it("renders face values for aces and kings", () => {
    const card = renderCard({ rank: 12, suit: "♥" });

    expect(card.textContent).toBe("♥KK♥");
    // WCAG-AA compliant red (see RED in Card.jsx).
    expect(card.style.color).toBe("rgb(213, 0, 0)");
  });

  it("calls selectCardFn with its object key when clicked", () => {
    const selectCardFn = vi.fn();
    const card = renderCard({ objKey: "7♣", selectCardFn });

    card.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("7♣");
  });
});

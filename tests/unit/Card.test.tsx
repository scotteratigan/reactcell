import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Card, { type CardProps } from "../../src/Card";
import { cleanupRender, type RenderedResult, renderIntoDocument } from "../testUtils";

let rendered: RenderedResult | null = null;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderCard(props: Partial<CardProps> = {}): HTMLElement {
  rendered = renderIntoDocument(
    <Card rank={0} suit="♠" selectCardFn={() => {}} objKey="0♠" {...props} />,
  );

  return rendered.container.firstChild as HTMLElement;
}

describe("Card", () => {
  it("renders face values for aces and kings", () => {
    const card = renderCard({ rank: 12, suit: "♥" });

    // Two corner index blocks (rank then suit) plus a centered suit pip.
    expect(card.textContent).toBe("K♥♥K♥");
    // Color is conveyed via a data attribute and styled in CSS (see Card.module.css).
    expect(card.getAttribute("data-color")).toBe("red");
  });

  it("calls selectCardFn with its object key when clicked", () => {
    const selectCardFn = vi.fn<(objKey: string) => void>();
    const card = renderCard({ objKey: "7♣", selectCardFn });

    card.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectCardFn).toHaveBeenCalledWith("7♣");
  });
});

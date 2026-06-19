import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Foundation, { type FoundationProps } from "../../src/Foundation";
import { cleanupRender, type RenderedResult, renderIntoDocument } from "../testUtils";

let rendered: RenderedResult | null = null;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

function renderFoundation(props: Partial<FoundationProps> = {}): HTMLElement {
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

  return rendered.container.firstChild as HTMLElement;
}

describe("Foundation", () => {
  it("selects its empty square location when empty", () => {
    const selectEmptySquareFn = vi.fn<(location: string) => void>();
    const foundation = renderFoundation({ selectEmptySquareFn });

    foundation.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectEmptySquareFn).toHaveBeenCalledWith("foundation1");
  });

  it("renders only the top foundation card", () => {
    const selectCardFn = vi.fn<(objKey: string) => void>();
    const foundation = renderFoundation({
      cards: [
        { rank: 0, suit: "♠", selected: false, location: "foundation", objKey: "0♠" },
        { rank: 1, suit: "♠", selected: true, location: "foundation", objKey: "1♠" },
      ],
      selectCardFn,
    });

    expect(foundation.textContent).toBe("♠22♠");
    expect((foundation.firstChild as HTMLElement).style.border).toBe("2px solid rgb(213, 0, 0)");

    (foundation.firstChild as HTMLElement).dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(selectCardFn).toHaveBeenCalledWith("1♠");
  });
});

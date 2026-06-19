import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { cleanupRender, type RenderedResult, renderIntoDocument } from "../testUtils";

let rendered: RenderedResult | null = null;

afterEach(() => {
  cleanupRender(rendered);
  rendered = null;
});

describe("App", () => {
  it("renders the game title", () => {
    rendered = renderIntoDocument(<App />);

    expect(rendered.container.textContent).toContain("ReactCell");
  });
});

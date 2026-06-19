import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { cleanupRender, renderIntoDocument } from "./testUtils";

let rendered;

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

import React from "react";
import ReactDOM from "react-dom";
import { afterEach, describe, it } from "vitest";
import App from "./App";

let container;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

describe("App", () => {
  it("renders without crashing", () => {
    container = document.createElement("div");
    document.body.appendChild(container);

    ReactDOM.render(<App />, container);
  });
});

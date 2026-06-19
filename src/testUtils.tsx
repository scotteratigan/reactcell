import { act } from "react";
import { createRoot } from "react-dom/client";

export function renderIntoDocument(element) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);
  act(() => {
    root.render(element);
  });

  return { container, root };
}

export function cleanupRender(rendered) {
  if (!rendered) return;

  act(() => {
    rendered.root.unmount();
  });
  rendered.container.remove();
}

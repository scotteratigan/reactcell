import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

export interface RenderedResult {
  container: HTMLDivElement;
  root: Root;
}

export function renderIntoDocument(element: ReactNode): RenderedResult {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);
  act(() => {
    root.render(element);
  });

  return { container, root };
}

export function cleanupRender(rendered: RenderedResult | null): void {
  if (!rendered) return;

  act(() => {
    rendered.root.unmount();
  });
  rendered.container.remove();
}

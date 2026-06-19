import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/reactcell/",
  plugins: [
    react({
      include: "**/*.{js,jsx,ts,tsx}",
      jsxRuntime: "classic",
    }),
  ],
  test: {
    environment: "jsdom",
    // Unit tests live in tests/unit; e2e is owned by Playwright (see playwright.config.ts).
    include: ["tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/reactcell/",
  plugins: [
    react({
      include: "**/*.{js,jsx}",
      jsxRuntime: "classic",
    }),
  ],
  test: {
    environment: "jsdom",
    // Unit tests live in src; e2e/ is owned by Playwright (see playwright.config.js).
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});

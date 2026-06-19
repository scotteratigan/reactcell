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
  },
});

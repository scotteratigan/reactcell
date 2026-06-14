import { defineConfig } from "vitest/config";
import { transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "load-js-as-jsx",
      enforce: "pre",
      transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) return null;

        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "transform"
        });
      }
    },
    react({
      include: "**/*.{js,jsx}",
      jsxRuntime: "classic"
    })
  ],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    jsx: "transform"
  },
  test: {
    environment: "jsdom"
  }
});

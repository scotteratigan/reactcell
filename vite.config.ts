import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the GitHub Pages project subpath (https://scotteratigan.github.io/reactcell/)
export default defineConfig({
  base: "/reactcell/",
  plugins: [
    react({
      include: "**/*.{js,jsx,ts,tsx}",
    }),
  ],
});

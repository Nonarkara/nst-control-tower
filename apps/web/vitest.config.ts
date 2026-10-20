import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate vitest config — avoids the @vitejs/plugin-react type conflict that
// arises when vitest/config's bundled vite and the project's vite have
// different @types/node versions. Tests run in Node (including server rendering), so the
// react plugin is not needed here. The full vite config (with react plugin)
// lives in vite.config.ts and is used only for the build.
export default defineConfig({
  test: {
    // Node utilities and server-rendered component contracts; no browser DOM.
    // Real geometry and interactions live in tests/e2e/ (Playwright).
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "tests/e2e"],
  },
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@nst/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});

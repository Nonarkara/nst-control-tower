import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@nst/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8794",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    // deck.gl + maplibre are inherently large (~1 MB each gzipped to ~300 KB);
    // they're now split into stable vendor chunks so the warning is expected.
    chunkSizeWarningLimit: 1500,
    // NOTE: no manual chunk splitting. Splitting React into its own vendor chunk
    // caused a cross-chunk init race (vendor code reading React.createContext /
    // useLayoutEffect before React initialised) → blank production screen.
    // Rollup's default chunking orders module init correctly; keep it simple.
  },
});

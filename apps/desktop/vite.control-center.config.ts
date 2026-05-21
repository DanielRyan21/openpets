import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  root: resolve(__dirname, "src/renderer/control-center"),
  build: {
    outDir: resolve(__dirname, "dist/renderer/control-center"),
    emptyOutDir: true,
  },
});

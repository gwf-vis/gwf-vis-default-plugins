import { defineConfig } from "vite";
import glob from "tiny-glob";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    lib: {
      entry: await glob("src/plugins/*.plugin.ts"),
      formats: ["es"],
    },
  },
});

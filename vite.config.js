import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["vitepress-plugin-mermaid"],
  },
  ssr: {
    noExternal: ["vitepress-plugin-mermaid"],
  },
});

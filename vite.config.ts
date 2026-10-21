import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "pages" ? "/" : "/static/react/",
  publicDir: mode === "pages" ? "public" : false,
  build: mode === "pages" ? {
    outDir: "dist",
    emptyOutDir: true,
  } : {
    outDir: "havadurumu/static/react",
    emptyOutDir: true,
    manifest: false,
    rollupOptions: {
      input: "frontend/main.tsx",
      output: {
        entryFileNames: "assets/app.js",
        assetFileNames: ({ names }) =>
          names.some((name) => name.endsWith(".css"))
            ? "assets/app.css"
            : "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js"
      }
    }
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000"
    }
  }
}));

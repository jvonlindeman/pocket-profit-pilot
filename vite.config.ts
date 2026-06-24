import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Forward Gunpla inventory API calls to the local SQLite server.
      // Start it with: cd server && npm install && npm start
      "/gunpla-api": {
        target: "http://localhost:4787",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gunpla-api/, "/api"),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

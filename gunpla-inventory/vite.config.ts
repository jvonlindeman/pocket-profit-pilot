import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    proxy: {
      // Forward inventory API calls to the local JSON-file server.
      // Start it with: npm run server  (or: cd server && npm start)
      "/gunpla-api": {
        target: "http://localhost:4787",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gunpla-api/, "/api"),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

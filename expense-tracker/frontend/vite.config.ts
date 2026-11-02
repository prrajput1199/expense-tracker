import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development, /api requests are proxied to the FastAPI server,
// so the browser never has to deal with CORS.
const target = process.env.VITE_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target, changeOrigin: true } },
  },
});

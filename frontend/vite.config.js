import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Lê a porta do backend no backend/.env (PORT=...) para o proxy apontar para o lugar certo.
function portaDoBackend() {
  try {
    const env = fs.readFileSync(new URL("../backend/.env", import.meta.url), "utf8");
    return env.match(/^\s*PORT\s*=\s*(\d+)/m)?.[1] || "3000";
  } catch {
    return "3000";
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Em desenvolvimento, as chamadas para /api vão para o backend (npm start na pasta backend)
    proxy: { "/api": `http://localhost:${portaDoBackend()}` },
  },
});

// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl"; // <-- Import plugin ssl

export default defineConfig({
  // Thêm khối server và bật https
  server: {
    https: true,
  },
  plugins: [
    react(),
    basicSsl(), // <-- Kích hoạt plugin ssl
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Nam Việt EMS",
        short_name: "NamVietEMS",
        theme_color: "#0D5EA6",
      },
    }),
  ],
});

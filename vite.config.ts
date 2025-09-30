// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl"; // <-- Thêm import mới

export default defineConfig({
  server: {
    https: true, // <-- Bật chế độ HTTPS
  },
  plugins: [
    react(),
    basicSsl(), // <-- Thêm plugin vào đây
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

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Nam Việt EMS",
        short_name: "NamVietEMS",
        theme_color: "#0D5EA6",
      },
      // NÂNG CẤP: Thêm khối workbox để tăng giới hạn file
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Tăng giới hạn lên 5MB
      },
    }),
  ],
});

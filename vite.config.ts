import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa"; // <-- Thêm import

export default defineConfig({
  plugins: [
    react(),
    // Thêm cấu hình PWA vào đây
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        // Các thông tin trong này sẽ ghi đè file manifest.json nếu cần
        name: "Nam Việt EMS",
        short_name: "NamVietEMS",
        theme_color: "#0D5EA6",
      },
    }),
  ],
});

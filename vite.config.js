import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/finance-app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Dylan Finance App",
        short_name: "Finance",
        description: "Personal finance tracking app",
        theme_color: "#0d6efd",
        background_color: "#f4f7fb",
        display: "standalone",
        start_url: "/finance-app/",
        icons: [
          {
            src: "/finance-app/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/finance-app/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
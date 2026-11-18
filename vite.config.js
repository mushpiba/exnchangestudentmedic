import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "./",
  build: { target: "es2022" },
  plugins: [
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      manifest: {
        id: "./",
        name: "NARU · 나루",
        short_name: "NARU",
        description: "Prepare in your language, show it in Korean — health help for international students.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f5f7f6",
        theme_color: "#0f6b5c",
        icons: [192, 512].map((size) => ({
          src: "icon-" + size + ".png",
          sizes: size + "x" + size,
          type: "image/png",
          purpose: "any maskable",
        })),
      },
      workbox: {
        // Language packs are separate chunks; all are precached so a language switch works offline.
        // The OCR engine and models come from a CDN on first use and need a connection.
        globPatterns: ["**/*.{js,css,html,png,webmanifest}"],
        navigateFallback: "index.html",
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: "node" },
});

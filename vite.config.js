import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: './',
  plugins: [VitePWA({
    registerType: 'prompt', injectRegister: 'auto',
    manifest: { id: './', name: 'Inha Care · 인하케어', short_name: 'Inha Care', start_url: './', scope: './', display: 'standalone', background_color: '#f6f8f5', theme_color: '#174b42', icons: [192,512].map(size => ({src: 'icon-'+size+'.png', sizes: size+'x'+size, type: 'image/png', purpose: 'any maskable'})) },
    workbox: { globPatterns: ['**/*.{js,css,html,png,webmanifest}'], navigateFallback:'index.html' }
  })]
})

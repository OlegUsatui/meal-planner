import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: 'Meal Planner',
        short_name: 'Meal Planner',
        description: 'Локальне планування харчування, запасів і покупок',
        lang: 'uk',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff9f3',
        theme_color: '#e86f6f',
        icons: [
          {
            src: '/app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
      },
    }),
  ],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Restlos',
        short_name: 'Restlos',
        description: 'Koch- und Vorratsplaner für Solo-Haushalte',
        start_url: '/',
        display: 'standalone',
        background_color: '#F9F9F7',
        theme_color: '#316342',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.restlos\.lewinstrobl\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50 }
            }
          }
        ]
      }
    })
  ]
})

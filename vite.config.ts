import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Roll Estate',
        short_name: 'Roll Estate',
        description: 'Roll Estate roll-and-write PWA',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      pwaAssets: {
        image: 'public/vite.svg',
        overrideManifestIcons: true,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});


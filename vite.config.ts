import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  
  const env = loadEnv(mode, '.', '');
  const repoName = '/split-trip/';
 //const base = '/split-trip/';
  return {
    base = repoName;
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'ניהול תקציב טיולים',
          short_name: 'תקציב טיול',
          description: 'אפליקציה לניהול הוצאות משותפות בטיולים',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: repoName ,
          start_url: repoName ,
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

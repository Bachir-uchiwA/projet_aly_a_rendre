import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  css: {
    postcss: './postcss.config.js'
  },
  server: {
        proxy: {
            '/api': {
                target: 'https://projet-json-server-5.onrender.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        },
        hmr: {
            overlay: false // Disable error overlay
        }
    }
})


// Pas de changement nécessaire, le proxy ne s'applique qu'en dev
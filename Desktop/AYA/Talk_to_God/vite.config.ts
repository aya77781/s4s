import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite. Le frontend appelle l'API via /api, redirigé (proxy)
// vers le serveur Express local (port 3001) pendant le développement.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

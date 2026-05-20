import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5182,
    strictPort: false,
    host: true,   // expose on local network so phones can scan QR
    proxy: {
      '/api':      { target: 'http://localhost:8080', changeOrigin: true },
      '/uploads':  { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Standard local proxy for serverless functions during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Only proxy if not matched by a local file (standard Vercel behavior)
      }
    }
  }
})

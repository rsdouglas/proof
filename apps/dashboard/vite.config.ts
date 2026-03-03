import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8787',
      '/w': 'http://localhost:8787',
      '/c': 'http://localhost:8787',
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; " +
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:9999 http://127.0.0.1:9999; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "object-src 'none';"
    }
  },
  optimizeDeps: {
    exclude: ['argon2-browser']
  },
  build: {
    target: 'esnext'
  }
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dev server proxy: forward calls to /api to the remote backend to avoid CORS
  server: {
    proxy: {
      '/api': {
        target: 'https://ofialumnos.vercel.app',
        changeOrigin: true,
        secure: true,
        // keep the path as-is
        rewrite: (path) => path,
      }
    }
  }
})

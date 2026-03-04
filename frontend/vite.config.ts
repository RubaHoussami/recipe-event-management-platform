import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend must be running (e.g. uvicorn) or you get ECONNREFUSED. Set VITE_API_PROXY_TARGET if it runs elsewhere (e.g. http://127.0.0.1:8000).
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

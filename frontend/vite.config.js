import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:5001',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_API_PROXY || 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },
  }
})

<<<<<<< HEAD
import { defineConfig } from 'vite'
=======
import { defineConfig, loadEnv } from 'vite'
>>>>>>> 4dbc6f897430e46b54b20b67323e21f0a7267c9a
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
<<<<<<< HEAD
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
=======
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8085',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
>>>>>>> 4dbc6f897430e46b54b20b67323e21f0a7267c9a
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8090,
    proxy: {
      // Forward all /disaster-management requests to the Spring Boot service.
      // The backend runs on port 8080
      '/disaster-management': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

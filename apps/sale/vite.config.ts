import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Enable network access
    port: 5174,
    hmr: {
      port: 5174,
    },
  },
})

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The backend only allows browser requests from http://localhost:5173 (CORS),
    // so fail instead of silently moving to another port when 5173 is taken.
    port: 5173,
    strictPort: true,
  },
})

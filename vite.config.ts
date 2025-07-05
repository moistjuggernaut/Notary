import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  
  // Development server configuration
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to local development server or GCP during development
      '/api': {
        target: process.env.VITE_GCP_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Build configuration for Vercel deployment
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot'],
        }
      }
    }
  },
  
  // Environment variables for the frontend
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})

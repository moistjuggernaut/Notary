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
      // Proxy API calls to the local Python backend during development
      '/api': {
        target: 'http://localhost:8080',
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

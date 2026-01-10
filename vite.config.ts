import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import devServer from '@hono/vite-dev-server'
// import vercel from "vite-plugin-vercel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // vercel(),
    react(), 
    tsconfigPaths(),
    devServer({
      entry: 'api/index.ts',
      exclude: [/^(?!\/api).*/]
    })
  ],
  
  // Development server configuration
  server: {
    port: 3000
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

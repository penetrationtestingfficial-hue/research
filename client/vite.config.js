// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@api': path.resolve(__dirname, './src/api'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  
  // Development server config
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
    open: true, // Auto-open browser
    
    // Proxy API requests to Flask backend
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'web3-vendor': ['ethers']
        }
      }
    }
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
  
  // Enable/disable optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'ethers'],
    exclude: []
  }
})
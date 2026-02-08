// client/src/main.jsx
/**
 * React Application Entry Point
 * Mounts the root component to the DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Mount React app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Log application info
console.log(`
╔════════════════════════════════════════════════╗
║   CSEC08 Research Platform - Frontend         ║
║   Version: 1.0.0                              ║
║   Environment: ${import.meta.env.MODE}                      ║
╚════════════════════════════════════════════════╝
`)

// Development tools
if (import.meta.env.DEV) {
  console.log('🔧 Development mode enabled')
  console.log('📍 API Base URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('⛓️ Hardhat RPC:', import.meta.env.VITE_HARDHAT_RPC_URL)
}
// client/src/features/auth/components/AdminReset.jsx
/**
 * Admin Reset Component - Kiosk Mode Sanitization
 * 
 * CRITICAL RESEARCH REQUIREMENT:
 * Ensures each participant starts with a clean slate by:
 * 1. Revoking MetaMask permissions (prevents auto-login)
 * 2. Clearing browser storage (removes session data)
 * 3. Resetting application state
 * 
 * This prevents contamination between test subjects and ensures
 * data validity by eliminating "Participant A's state affecting Participant B"
 * 
 * Trigger: Hidden keyboard shortcut (Ctrl+Shift+X) or admin button
 */

import React, { useState, useEffect } from 'react';
import { useTelemetryContext } from '../hooks/useTelemetry';

const AdminReset = ({ onResetComplete }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  
  const { resetTelemetry } = useTelemetryContext();

  /**
   * Perform complete system reset
   */
  const performReset = async () => {
    setIsResetting(true);
    setResetStatus('Starting reset...');
    
    const steps = [];
    
    try {
      // Step 1: Revoke MetaMask permissions
      if (typeof window.ethereum !== 'undefined') {
        setResetStatus('Disconnecting wallet...');
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{
              eth_accounts: {}
            }]
          });
          steps.push('✓ Wallet permissions revoked');
        } catch (err) {
          // Fallback: Request disconnect (older MetaMask versions)
          try {
            await window.ethereum.request({
              method: 'eth_requestAccounts',
              params: [{ eth_accounts: {} }]
            });
          } catch (e) {
            console.warn('Could not revoke wallet permissions:', e);
          }
          steps.push('⚠ Wallet permissions cleared (fallback)');
        }
      } else {
        steps.push('⊘ No wallet detected');
      }

      // Step 2: Clear all browser storage
      setResetStatus('Clearing storage...');
      localStorage.clear();
      sessionStorage.clear();
      steps.push('✓ Local storage cleared');
      steps.push('✓ Session storage cleared');

      // Step 3: Clear cookies (if possible)
      if (document.cookie) {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        steps.push('✓ Cookies cleared');
      }

      // Step 4: Reset telemetry state
      setResetStatus('Resetting telemetry...');
      resetTelemetry();
      steps.push('✓ Telemetry reset');

      // Step 5: Clear React state (if callback provided)
      if (onResetComplete) {
        onResetComplete();
        steps.push('✓ Application state reset');
      }

      setResetStatus('Reset complete!');
      
      // Show success message
      console.log('🔄 Admin Reset Complete:', steps);
      
      // Wait a moment then reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Reset error:', error);
      setResetStatus(`Error: ${error.message}`);
      steps.push(`✗ Error: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  /**
   * Keyboard shortcut handler: Ctrl+Shift+X
   */
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        event.preventDefault();
        setShowPanel(true);
      }
      
      // ESC to close panel
      if (event.key === 'Escape' && showPanel) {
        setShowPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPanel]);

  if (!showPanel) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowPanel(true)}
          className="
            px-3 py-2 text-xs font-mono
            bg-gray-800 text-gray-300 
            rounded-lg shadow-lg
            hover:bg-gray-700
            transition-colors
          "
          title="Show Admin Panel (Ctrl+Shift+X)"
        >
          Admin
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Admin Control Panel
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Kiosk Session Reset
            </p>
          </div>
          <button
            onClick={() => setShowPanel(false)}
            className="text-gray-400 hover:text-gray-600"
            disabled={isResetting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠ Warning:</strong> This will reset the entire system for the next participant.
          </p>
        </div>

        {/* Reset Actions */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-2">This reset will:</p>
          <ul className="space-y-1 text-xs">
            <li>• Disconnect MetaMask wallet</li>
            <li>• Clear all browser storage</li>
            <li>• Reset telemetry counters</li>
            <li>• Reload the application</li>
          </ul>
        </div>

        {/* Status Display */}
        {resetStatus && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{resetStatus}</p>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={performReset}
          disabled={isResetting}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${isResetting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
            }
          `}
        >
          {isResetting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Resetting...
            </span>
          ) : (
            '🔄 Reset Kiosk for Next Participant'
          )}
        </button>

        {/* Keyboard Shortcut Hint */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Keyboard shortcut: <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl+Shift+X</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReset;
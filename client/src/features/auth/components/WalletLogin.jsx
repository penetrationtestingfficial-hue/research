// client/src/features/auth/components/WalletLogin.jsx
/**
 * DID Authentication Component (Experimental Group)
 * 
 * Implements passwordless authentication using cryptographic signatures.
 * This component is the experimental variable in the A/B test.
 */

import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useTelemetryContext } from '../hooks/useTelemetry';

const WalletLogin = ({ onSuccess, onError }) => {
  const {
    account,
    isConnecting,
    isAuthenticating,
    error: web3Error,
    isConnected,
    connectWallet,
    authenticate,
    checkWalletAvailability
  } = useWeb3Auth();

  const { 
    startTracking, 
    stopTracking, 
    containerRef, 
    isTracking 
  } = useTelemetryContext();

  const [localError, setLocalError] = useState(null);

  /**
   * Check wallet availability on mount
   */
  useEffect(() => {
    checkWalletAvailability();
  }, [checkWalletAvailability]);

  /**
   * Start telemetry when component mounts
   * This marks the beginning of the login task
   */
  useEffect(() => {
    startTracking();
    
    // Cleanup on unmount
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [startTracking]);

  /**
   * Handle wallet connection
   */
  const handleConnect = async () => {
    setLocalError(null);
    const connectedAccount = await connectWallet();
    
    if (!connectedAccount) {
      setLocalError(web3Error?.message || 'Failed to connect wallet');
    }
  };

  /**
   * Handle authentication (sign message)
   */
  const handleAuthenticate = async () => {
    setLocalError(null);
    
    // Get telemetry metrics up to this point
    const telemetryMetrics = stopTracking();
    
    // Perform authentication with telemetry data
    const result = await authenticate(telemetryMetrics);
    
    if (result.success) {
      onSuccess(result);
    } else {
      setLocalError(
        result.error === 'USER_REJECTED_SIGNATURE'
          ? 'You cancelled the signature request. Please try again.'
          : 'Authentication failed. Please try again.'
      );
      onError(result);
      
      // Restart tracking for retry
      startTracking();
    }
  };

  /**
   * Display current error (web3 or local)
   */
  const displayError = localError || web3Error?.message;

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Login with Wallet
        </h2>
        <p className="text-sm text-gray-600">
          Secure authentication using your Ethereum wallet
        </p>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}

      {/* Wallet Not Detected */}
      {web3Error?.code === 'ERR_NO_WALLET' && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>MetaMask Required</strong>
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            This authentication method requires the MetaMask browser extension.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Install MetaMask →
          </a>
        </div>
      )}

      {/* Step 1: Connect Wallet */}
      {!isConnected && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-1">
              <strong>Step 1:</strong> Connect Your Wallet
            </p>
            <p className="text-xs text-blue-700">
              Click below to connect your MetaMask wallet. This identifies your account.
            </p>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting || web3Error?.code === 'ERR_NO_WALLET'}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-white
              transition-colors duration-200
              ${isConnecting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }
            `}
          >
            {isConnecting ? (
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
                Connecting...
              </span>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      )}

      {/* Step 2: Authenticate (Sign Message) */}
      {isConnected && (
        <div className="space-y-4">
          {/* Connected Account Display */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 mb-1">
              <strong>✓ Wallet Connected</strong>
            </p>
            <p className="text-xs text-green-700 font-mono break-all">
              {account}
            </p>
          </div>

          {/* Step 2 Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-1">
              <strong>Step 2:</strong> Sign Message
            </p>
            <p className="text-xs text-blue-700">
              Click below to prove you own this wallet. MetaMask will ask you to sign a message.
            </p>
          </div>

          {/* Authenticate Button */}
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-white
              transition-colors duration-200
              ${isAuthenticating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }
            `}
          >
            {isAuthenticating ? (
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
                Authenticating...
              </span>
            ) : (
              'Sign & Login'
            )}
          </button>
        </div>
      )}

      {/* Educational Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800 font-medium mb-2">
            🔐 How does this work?
          </summary>
          <div className="space-y-2 mt-2 text-gray-500">
            <p>
              <strong>Passwordless authentication:</strong> Instead of remembering a password, 
              you prove ownership of your wallet by signing a unique challenge.
            </p>
            <p>
              <strong>Privacy:</strong> Your private key never leaves your device. 
              Only a cryptographic signature is sent to the server.
            </p>
            <p>
              <strong>Security:</strong> Even if the signature is intercepted, it cannot 
              be reused (replay protection) or used to access your funds.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default WalletLogin;
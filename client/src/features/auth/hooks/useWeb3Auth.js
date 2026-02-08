// client/src/features/auth/hooks/useWeb3Auth.js
/**
 * Web3 Authentication Hook
 * Manages DID authentication flow using MetaMask and ethers.js
 * 
 * Flow:
 * 1. Connect to MetaMask wallet
 * 2. Request nonce from backend
 * 3. Sign nonce with private key (via MetaMask)
 * 4. Send signature to backend for verification
 */

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import api from '../../../api/axios';

export const useWeb3Auth = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);
  
  // Telemetry tracking
  const [telemetry, setTelemetry] = useState({
    walletConnectStart: null,
    walletConnectEnd: null,
    challengeRequestStart: null,
    challengeRequestEnd: null,
    signStart: null,
    signEnd: null
  });

  /**
   * Check if MetaMask is installed
   */
  const checkWalletAvailability = useCallback(() => {
    if (typeof window.ethereum === 'undefined') {
      setError({
        code: 'ERR_NO_WALLET',
        message: 'MetaMask is not installed. Please install MetaMask to use DID authentication.',
        category: 'SYSTEM'
      });
      return false;
    }
    return true;
  }, []);

  /**
   * Connect to MetaMask wallet
   * This only proves the user CAN access the wallet, not that they OWN it
   */
  const connectWallet = useCallback(async () => {
    if (!checkWalletAvailability()) return null;

    setIsConnecting(true);
    setError(null);
    
    // Start telemetry
    const connectStart = performance.now();
    setTelemetry(prev => ({ ...prev, walletConnectStart: connectStart }));

    try {
      // Create Web3 provider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      
      const connectEnd = performance.now();
      setTelemetry(prev => ({ ...prev, walletConnectEnd: connectEnd }));
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const userAccount = accounts[0];
      setAccount(userAccount);
      setProvider(web3Provider);
      
      console.log('✅ Wallet connected:', userAccount);
      return userAccount;

    } catch (err) {
      console.error('Wallet connection error:', err);
      
      let errorCode = 'ERR_CONNECTION_FAILED';
      let errorMessage = 'Failed to connect wallet';
      
      if (err.code === 4001) {
        // User rejected the connection request
        errorCode = 'USER_REJECTED_CONNECTION';
        errorMessage = 'You declined the wallet connection request';
      }
      
      setError({
        code: errorCode,
        message: errorMessage,
        category: 'USABILITY',
        original: err.message
      });
      
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [checkWalletAvailability]);

  /**
   * Main authentication function
   * Implements the complete challenge-response flow
   */
  const authenticate = useCallback(async (mouseMetrics = {}) => {
    if (!account || !provider) {
      setError({
        code: 'ERR_NOT_CONNECTED',
        message: 'Please connect your wallet first',
        category: 'USABILITY'
      });
      return { success: false };
    }

    setIsAuthenticating(true);
    setError(null);

    const authStartTime = performance.now();
    
    try {
      // ===== STEP 1: Request Nonce (Challenge) =====
      const challengeStart = performance.now();
      setTelemetry(prev => ({ ...prev, challengeRequestStart: challengeStart }));
      
      const nonceResponse = await api.get(`/auth/nonce/${account}`);
      
      const challengeEnd = performance.now();
      setTelemetry(prev => ({ ...prev, challengeRequestEnd: challengeEnd }));
      
      if (!nonceResponse.data.success) {
        throw new Error('Failed to generate nonce');
      }

      const { message } = nonceResponse.data;
      
      console.log('✅ Challenge received:', message.substring(0, 50) + '...');

      // ===== STEP 2: Sign Message (Response) =====
      // CRITICAL: Use signMessage() which implements EIP-191 (personal_sign)
      // This adds the "Ethereum Signed Message" prefix for security
      
      const signStart = performance.now();
      setTelemetry(prev => ({ ...prev, signStart }));
      
      const signer = await provider.getSigner();
      
      // This triggers MetaMask popup - user must click "Sign"
      // This interaction is the PRIMARY VARIABLE being measured
      const signature = await signer.signMessage(message);
      
      const signEnd = performance.now();
      setTelemetry(prev => ({ ...prev, signEnd }));
      
      console.log('✅ Message signed');

      // ===== STEP 3: Verify Signature =====
      const authEndTime = performance.now();
      
      // Compile telemetry data
      const telemetryData = {
        time_taken_ms: Math.round(authEndTime - authStartTime),
        wallet_connect_ms: Math.round(
          telemetry.walletConnectEnd - telemetry.walletConnectStart
        ),
        challenge_request_ms: Math.round(challengeEnd - challengeStart),
        sign_duration_ms: Math.round(signEnd - signStart),
        ...mouseMetrics
      };

      const verifyResponse = await api.post('/auth/verify', {
        address: account,
        signature,
        telemetry: telemetryData,
        session_id: crypto.randomUUID()
      });

      if (verifyResponse.data.success) {
        console.log('✅ Authentication successful');
        return {
          success: true,
          token: verifyResponse.data.token,
          user: verifyResponse.data.user,
          telemetry: telemetryData
        };
      }

      throw new Error('Signature verification failed');

    } catch (err) {
      console.error('Authentication error:', err);
      
      let errorCode = 'ERR_AUTH_FAILED';
      let errorMessage = 'Authentication failed';
      let errorCategory = 'SYSTEM';
      
      // Classify errors for research purposes
      if (err.code === 4001 || err.message.includes('user rejected')) {
        errorCode = 'USER_REJECTED_SIGNATURE';
        errorMessage = 'You cancelled the signature request';
        errorCategory = 'USABILITY';
      } else if (err.response?.status === 401) {
        errorCode = 'SIGNATURE_VERIFICATION_FAILED';
        errorMessage = 'Signature verification failed';
        errorCategory = 'SYSTEM';
      } else if (err.code === 'NETWORK_ERROR') {
        errorCode = 'NETWORK_TIMEOUT';
        errorMessage = 'Network connection failed';
        errorCategory = 'SYSTEM';
      }
      
      setError({
        code: errorCode,
        message: errorMessage,
        category: errorCategory,
        original: err.message
      });
      
      return { 
        success: false, 
        error: errorCode,
        category: errorCategory
      };
      
    } finally {
      setIsAuthenticating(false);
    }
  }, [account, provider, telemetry]);

  /**
   * Disconnect wallet (for admin reset)
   */
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setError(null);
    setTelemetry({
      walletConnectStart: null,
      walletConnectEnd: null,
      challengeRequestStart: null,
      challengeRequestEnd: null,
      signStart: null,
      signEnd: null
    });
  }, []);

  /**
   * Listen for account changes
   */
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [disconnect]);

  return {
    // State
    account,
    isConnecting,
    isAuthenticating,
    error,
    isConnected: !!account,
    
    // Actions
    connectWallet,
    authenticate,
    disconnect,
    checkWalletAvailability,
    
    // Telemetry
    getTelemetryData: () => ({
      wallet_connect_ms: telemetry.walletConnectEnd 
        ? Math.round(telemetry.walletConnectEnd - telemetry.walletConnectStart)
        : null,
      challenge_request_ms: telemetry.challengeRequestEnd
        ? Math.round(telemetry.challengeRequestEnd - telemetry.challengeRequestStart)
        : null,
      sign_duration_ms: telemetry.signEnd
        ? Math.round(telemetry.signEnd - telemetry.signStart)
        : null
    })
  };
};
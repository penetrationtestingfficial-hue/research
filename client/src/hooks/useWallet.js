import { useState, useEffect, useCallback } from 'react';

export function useWallet() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if extension is installed
  useEffect(() => {
    const checkWallet = () => {
      if (window.csec08Wallet) {
        setIsInstalled(true);
        console.log('✅ CSEC08 Wallet detected');
      } else {
        setIsInstalled(false);
        console.log('❌ CSEC08 Wallet not found');
      }
    };

    // Check immediately
    checkWallet();

    // Listen for wallet ready event
    window.addEventListener('csec08WalletReady', checkWallet);

    return () => {
      window.removeEventListener('csec08WalletReady', checkWallet);
    };
  }, []);

  // Connect to wallet
  const connect = useCallback(async () => {
    if (!window.csec08Wallet) {
      setError({
        code: 'NO_WALLET',
        message: 'CSEC08 Wallet extension is not installed'
      });
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const result = await window.csec08Wallet.connect();
      setAddress(result.address);
      console.log('✅ Connected to wallet:', result.address);
      return result.address;
    } catch (err) {
      console.error('❌ Wallet connection failed:', err);
      setError({
        code: err.message,
        message: err.message === 'NO_WALLET'
          ? 'No wallet found. Please create one in the extension.'
          : 'Failed to connect to wallet'
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Sign a message
  const signMessage = useCallback(async (message) => {
    if (!window.csec08Wallet) {
      throw new Error('NO_WALLET');
    }

    try {
      const result = await window.csec08Wallet.signMessage(message);
      console.log('✅ Message signed');
      return result;
    } catch (err) {
      console.error('❌ Signing failed:', err);
      throw err;
    }
  }, []);

  return {
    isInstalled,
    address,
    isConnected: !!address,
    isConnecting,
    error,
    connect,
    signMessage
  };
}
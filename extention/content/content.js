// CSEC08 Wallet Extension - Content Script
// Injected into web pages to provide wallet API

console.log('🌐 CSEC08 Wallet Content Script Loaded');

// Pending promise resolvers for async requests
const pendingPromises = new Map();

/**
 * Create the wallet API object that websites can access
 */
function injectWalletAPI() {
  // Check if already injected
  if (window.csec08Wallet) {
    console.log('Wallet API already injected');
    return;
  }

  window.csec08Wallet = {
    isInstalled: true,
    version: '1.0.0',
    
    /**
     * Check if wallet exists and get address
     */
    async connect() {
      console.log('🔗 Wallet connect requested');
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'GET_WALLET' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Connection error:', chrome.runtime.lastError);
            reject(new Error('EXTENSION_ERROR'));
            return;
          }
          
          if (response.success && response.wallet) {
            console.log('✓ Wallet connected:', response.wallet.address.substring(0, 10) + '...');
            resolve({
              address: response.wallet.address,
              connected: true
            });
          } else {
            console.log('✗ No wallet found');
            reject(new Error('NO_WALLET'));
          }
        });
      });
    },

    /**
     * Request signature for a message
     */
    async signMessage(message) {
      console.log('✍️ Signature requested for:', message.substring(0, 50) + '...');
      
      return new Promise((resolve, reject) => {
        const requestId = crypto.randomUUID();
        
        // Store promise resolver
        pendingPromises.set(requestId, { resolve, reject });
        
        // Send request to background script
        chrome.runtime.sendMessage({
          type: 'REQUEST_SIGNATURE',
          data: {
            message: message,
            requestId: requestId
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Signature request error:', chrome.runtime.lastError);
            pendingPromises.delete(requestId);
            reject(new Error('EXTENSION_ERROR'));
          }
        });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (pendingPromises.has(requestId)) {
            console.error('Signature request timed out');
            pendingPromises.delete(requestId);
            reject(new Error('SIGNATURE_TIMEOUT'));
          }
        }, 5 * 60 * 1000);
      });
    },

    /**
     * Get current wallet address without prompting
     */
    async getAddress() {
      try {
        const result = await this.connect();
        return result.address;
      } catch (error) {
        return null;
      }
    },

    /**
     * Check if wallet is connected
     */
    async isConnected() {
      try {
        await this.connect();
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  console.log('✅ Wallet API injected into page');
  
  // Dispatch custom event to notify page
  window.dispatchEvent(new CustomEvent('csec08WalletReady', {
    detail: { version: '1.0.0' }
  }));
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received:', request.type);

  switch (request.type) {
    case 'SIGNATURE_RESPONSE':
      handleSignatureResponse(request.data);
      break;
      
    case 'WALLET_CONNECTED':
      // Notify page that wallet was connected
      window.dispatchEvent(new CustomEvent('csec08WalletConnected', {
        detail: request.data
      }));
      break;
      
    case 'WALLET_DISCONNECTED':
      // Notify page that wallet was disconnected
      window.dispatchEvent(new CustomEvent('csec08WalletDisconnected'));
      break;
      
    default:
      console.log('Unknown message type:', request.type);
  }
  
  sendResponse({ received: true });
});

/**
 * Handle signature response from background/popup
 */
function handleSignatureResponse(data) {
  console.log('📝 Signature response received');
  
  // Find and resolve the pending promise
  for (const [requestId, promise] of pendingPromises.entries()) {
    // For now, resolve the first pending (in production, match by requestId)
    if (data.success) {
      console.log('✓ Signature approved');
      promise.resolve({
        signature: data.signature,
        address: data.address
      });
    } else {
      console.log('✗ Signature rejected:', data.error);
      promise.reject(new Error(data.error || 'SIGNATURE_REJECTED'));
    }
    pendingPromises.delete(requestId);
    break;
  }
}

/**
 * Initialize on load
 */
(function init() {
  // Inject wallet API immediately
  injectWalletAPI();
  
  // Re-inject if page dynamically reloads content
  const observer = new MutationObserver(() => {
    if (!window.csec08Wallet) {
      console.log('🔄 Re-injecting wallet API');
      injectWalletAPI();
    }
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Content script initialized');
})();
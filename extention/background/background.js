// CSEC08 Wallet Extension - Background Service Worker
// Handles communication between popup, content script, and web pages

console.log('🔧 CSEC08 Wallet Background Script Loaded');

// Store pending signature requests
const pendingRequests = new Map();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received:', request.type, 'from', sender.tab ? 'content script' : 'popup');

  switch (request.type) {
    case 'GET_WALLET':
      handleGetWallet(sendResponse);
      return true; // Keep channel open for async
      
    case 'REQUEST_SIGNATURE':
      handleSignatureRequest(request.data, sender, sendResponse);
      return true;
      
    case 'SIGNATURE_APPROVED':
      handleSignatureApproved(request.data);
      break;
      
    case 'SIGNATURE_REJECTED':
      handleSignatureRejected(request.data);
      break;
      
    default:
      console.log('Unknown message type:', request.type);
  }
});

/**
 * Get wallet from storage
 */
async function handleGetWallet(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['wallet']);
    sendResponse({ 
      success: true,
      wallet: result.wallet || null 
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    sendResponse({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Handle signature request from website
 */
async function handleSignatureRequest(data, sender, sendResponse) {
  console.log('🔐 Signature request from:', sender.tab?.url);
  
  // Check if wallet exists
  const result = await chrome.storage.local.get(['wallet']);
  
  if (!result.wallet) {
    sendResponse({
      success: false,
      error: 'NO_WALLET',
      message: 'No wallet found. Please create or import a wallet first.'
    });
    return;
  }
  
  // Generate unique request ID
  const requestId = crypto.randomUUID();
  
  // Store request
  pendingRequests.set(requestId, {
    ...data,
    tabId: sender.tab.id,
    timestamp: Date.now(),
    sendResponse: sendResponse
  });
  
  // Open popup to show signature request
  try {
    // First, send message to existing popup if open
    chrome.runtime.sendMessage({
      type: 'SIGN_MESSAGE_REQUEST',
      data: {
        ...data,
        origin: new URL(sender.tab.url).origin,
        requestId: requestId
      }
    }).catch(() => {
      // If no popup is open, create one
      chrome.windows.create({
        url: chrome.runtime.getURL('popup/popup.html'),
        type: 'popup',
        width: 380,
        height: 620,
        focused: true
      });
      
      // Wait a bit then send the message again
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'SIGN_MESSAGE_REQUEST',
          data: {
            ...data,
            origin: new URL(sender.tab.url).origin,
            requestId: requestId
          }
        }).catch(err => console.log('Popup will receive message on load'));
      }, 500);
    });
    
  } catch (error) {
    console.error('Error opening popup:', error);
    sendResponse({
      success: false,
      error: 'POPUP_ERROR',
      message: 'Failed to open signature popup'
    });
    pendingRequests.delete(requestId);
  }
}

/**
 * Handle signature approval from popup
 */
function handleSignatureApproved(data) {
  console.log('✅ Signature approved:', data.requestId);
  
  const request = pendingRequests.get(data.requestId);
  
  if (!request) {
    console.error('Request not found:', data.requestId);
    return;
  }
  
  // Send signature back to content script
  chrome.tabs.sendMessage(request.tabId, {
    type: 'SIGNATURE_RESPONSE',
    data: {
      success: true,
      signature: data.signature,
      address: data.address
    }
  }).catch(err => console.error('Error sending to content script:', err));
  
  // Clean up
  pendingRequests.delete(data.requestId);
}

/**
 * Handle signature rejection from popup
 */
function handleSignatureRejected(data) {
  console.log('❌ Signature rejected:', data.requestId);
  
  const request = pendingRequests.get(data.requestId);
  
  if (!request) {
    console.error('Request not found:', data.requestId);
    return;
  }
  
  // Send rejection back to content script
  chrome.tabs.sendMessage(request.tabId, {
    type: 'SIGNATURE_RESPONSE',
    data: {
      success: false,
      error: data.error || 'USER_REJECTED_SIGNATURE'
    }
  }).catch(err => console.error('Error sending to content script:', err));
  
  // Clean up
  pendingRequests.delete(data.requestId);
}

/**
 * Clean up old pending requests (older than 5 minutes)
 */
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  for (const [requestId, request] of pendingRequests.entries()) {
    if (now - request.timestamp > TIMEOUT) {
      console.log('⏰ Request timed out:', requestId);
      
      // Send timeout error
      chrome.tabs.sendMessage(request.tabId, {
        type: 'SIGNATURE_RESPONSE',
        data: {
          success: false,
          error: 'REQUEST_TIMEOUT'
        }
      }).catch(() => {});
      
      pendingRequests.delete(requestId);
    }
  }
}, 60000); // Check every minute

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Extension icon clicked');
  
  chrome.windows.create({
    url: chrome.runtime.getURL('popup/popup.html'),
    type: 'popup',
    width: 380,
    height: 620
  });
});

/**
 * Listen for installed/updated events
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 CSEC08 Wallet Extension installed!');
    
    // Open welcome page or instructions
    chrome.tabs.create({
      url: 'http://localhost:5173'
    });
  } else if (details.reason === 'update') {
    console.log('🔄 CSEC08 Wallet Extension updated to version', chrome.runtime.getManifest().version);
  }
});

console.log('✅ Background script ready');
// CSEC08 Wallet - Clean Implementation
console.log('🔐 CSEC08 Wallet Loading...');

let wallet = null;
let pendingRequest = null;

// Initialize
async function init() {
  // Load wallet
  const result = await chrome.storage.local.get(['wallet']);
  if (result.wallet) {
    wallet = result.wallet;
    showScreen('dashboard');
    updateDashboard();
  } else {
    showScreen('no-wallet');
  }
  
  setupListeners();
}

// Show screen
function showScreen(screenId) {
  console.log('Showing:', screenId);
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const screen = document.getElementById(screenId);
  if (screen) screen.style.display = 'block';
}

// Setup all listeners
function setupListeners() {
  // No wallet screen
  document.getElementById('btn-create').onclick = () => {
    generateWallet();
    showScreen('create-wallet');
  };
  
  document.getElementById('btn-import').onclick = () => {
    showScreen('import-wallet');
  };
  
  // Create wallet screen
  document.getElementById('back-create').onclick = () => showScreen('no-wallet');
  
  document.getElementById('confirm-saved').onchange = (e) => {
    document.getElementById('btn-save-wallet').disabled = !e.target.checked;
  };
  
  document.getElementById('btn-copy-create').onclick = () => {
    copyText(document.getElementById('create-key').textContent);
  };
  
  document.getElementById('btn-save-wallet').onclick = saveWallet;
  
  // Import wallet screen
  document.getElementById('back-import').onclick = () => showScreen('no-wallet');
  
  document.getElementById('btn-toggle-import').onclick = (e) => {
    const input = document.getElementById('import-key');
    if (input.type === 'password') {
      input.type = 'text';
      e.target.textContent = 'Hide';
    } else {
      input.type = 'password';
      e.target.textContent = 'Show';
    }
  };
  
  document.getElementById('btn-do-import').onclick = importWallet;
  
  // Dashboard screen
  document.getElementById('btn-copy-address').onclick = () => {
    copyText(wallet.address);
  };
  
  document.getElementById('btn-export').onclick = () => {
    showScreen('export-screen');
  };
  
  document.getElementById('btn-delete').onclick = deleteWallet;
  
  // Export screen
  document.getElementById('back-export').onclick = () => showScreen('dashboard');
  
  document.getElementById('btn-reveal').onclick = () => {
    document.getElementById('export-key').textContent = wallet.privateKey;
    document.getElementById('btn-copy-export').style.display = 'block';
  };
  
  document.getElementById('btn-copy-export').onclick = () => {
    copyText(wallet.privateKey);
  };
  
  // Sign request screen
  document.getElementById('btn-approve').onclick = approveSignature;
  document.getElementById('btn-reject').onclick = rejectSignature;
  
  // Listen for sign requests
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === 'SIGN_REQUEST') {
      handleSignRequest(msg.data);
    }
    respond({ok: true});
    return true;
  });
}

// Generate new wallet
async function generateWallet() {
  console.log('Generating wallet...');
  
  // Generate private key
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  const privateKey = '0x' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Derive address
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(privateKey));
  const hashArr = new Uint8Array(hash);
  const address = '0x' + Array.from(hashArr.slice(12, 32)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Display
  document.getElementById('create-key').textContent = privateKey;
  document.getElementById('create-address').textContent = address;
  
  // Store temporarily
  window.tempWallet = { privateKey, address };
}

// Save wallet
async function saveWallet() {
  wallet = window.tempWallet;
  await chrome.storage.local.set({ wallet });
  console.log('✓ Wallet saved');
  showScreen('dashboard');
  updateDashboard();
}

// Import wallet
async function importWallet() {
  const key = document.getElementById('import-key').value.trim();
  const errorDiv = document.getElementById('import-error');
  
  errorDiv.style.display = 'none';
  
  if (!key || !key.startsWith('0x') || key.length !== 66) {
    errorDiv.textContent = 'Invalid private key (must be 0x + 64 hex chars)';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    // Derive address
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
    const hashArr = new Uint8Array(hash);
    const address = '0x' + Array.from(hashArr.slice(12, 32)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    wallet = { privateKey: key, address };
    await chrome.storage.local.set({ wallet });
    console.log('✓ Wallet imported');
    showScreen('dashboard');
    updateDashboard();
  } catch (err) {
    errorDiv.textContent = 'Failed to import wallet';
    errorDiv.style.display = 'block';
  }
}

// Update dashboard
function updateDashboard() {
  if (wallet) {
    document.getElementById('dash-address').textContent = wallet.address;
  }
}

// Delete wallet
async function deleteWallet() {
  if (confirm('⚠️ Delete wallet? This cannot be undone!')) {
    await chrome.storage.local.remove(['wallet']);
    wallet = null;
    showScreen('no-wallet');
  }
}

// Copy text
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  } catch (err) {
    alert('Copy failed');
  }
}

// Handle sign request
function handleSignRequest(data) {
  pendingRequest = data;
  document.getElementById('req-origin').textContent = data.origin || 'Unknown';
  document.getElementById('req-message').textContent = data.message;
  showScreen('sign-request');
}

// Approve signature
async function approveSignature() {
  if (!pendingRequest || !wallet) return;
  
  try {
    // Sign message
    const msg = pendingRequest.message;
    const prefix = `\x19Ethereum Signed Message:\n${msg.length}`;
    const full = prefix + msg;
    const data = new TextEncoder().encode(full + wallet.privateKey);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const signature = '0x' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Send response
    chrome.runtime.sendMessage({
      type: 'SIGN_APPROVED',
      data: {
        signature,
        address: wallet.address,
        requestId: pendingRequest.requestId
      }
    });
    
    pendingRequest = null;
    showScreen('dashboard');
  } catch (err) {
    alert('Signing failed');
  }
}

// Reject signature
function rejectSignature() {
  chrome.runtime.sendMessage({
    type: 'SIGN_REJECTED',
    data: { requestId: pendingRequest?.requestId }
  });
  
  pendingRequest = null;
  showScreen('dashboard');
}

// Start
init();
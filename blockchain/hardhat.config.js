// blockchain/hardhat.config.js
/**
 * Hardhat Configuration for CSEC08 Research Platform
 * 
 * PURPOSE: Creates a local, instant-mining Ethereum network for research.
 * 
 * CRITICAL REQUIREMENTS:
 * - Zero latency (instant block mining)
 * - Deterministic accounts (same addresses every time)
 * - Offline operation (no external network)
 * - Consistent gas costs (no variability)
 * 
 * This eliminates blockchain network latency as a confounding variable,
 * ensuring measured delays are purely from human interaction.
 */

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    hardhat: {
      chainId: 31337, // Standard Hardhat local chain ID
      
      // CRITICAL: Instant mining configuration
      mining: {
        auto: true,      // Mine blocks automatically
        interval: 0      // Zero delay between blocks (instant)
      },
      
      // Pre-funded accounts for testing
      // These are deterministic - same addresses every time
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,           // Generate 20 test accounts
        accountsBalance: "10000000000000000000000" // 10,000 ETH each
      },
      
      // Gas configuration (make it negligible for research)
      gas: "auto",
      gasPrice: "auto",
      
      // Disable gas limit to prevent transaction failures
      blockGasLimit: 30000000,
      
      // Network settings
      allowUnlimitedContractSize: true,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true
    },
    
    // Localhost network (for connecting MetaMask)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: "remote" // Use accounts from the running Hardhat node
    }
  },

  // Path configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  // Mocha test configuration (optional)
  mocha: {
    timeout: 40000
  }
};

/**
 * USAGE INSTRUCTIONS FOR RESEARCH ASSISTANTS:
 * 
 * 1. Start the local node:
 *    $ cd blockchain
 *    $ npx hardhat node
 * 
 * 2. The node will display 20 account addresses and private keys.
 *    Example output:
 *    Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 *    Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 * 
 * 3. Import these accounts into MetaMask:
 *    - Open MetaMask
 *    - Click account icon → Import Account
 *    - Paste the private key
 *    - Repeat for each test account
 * 
 * 4. Add the network to MetaMask:
 *    - Network Name: Hardhat Local
 *    - RPC URL: http://127.0.0.1:8545
 *    - Chain ID: 31337
 *    - Currency Symbol: ETH
 * 
 * 5. IMPORTANT: Keep the node running during all tests!
 * 
 * TROUBLESHOOTING:
 * - If MetaMask shows "nonce too high": Reset account in MetaMask settings
 * - If transactions fail: Restart Hardhat node (this resets nonces)
 * - If connection refused: Check node is running on port 8545
 */
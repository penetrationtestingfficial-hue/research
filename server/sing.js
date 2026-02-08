import { Wallet } from "ethers";

const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const MESSAGE = "I am logging into the University Portal to access my dashboard.\nThis signature proves I own this wallet without revealing my private key.\n\nChallenge ID: 349fe1314619747f...\nTime: 2026-02-08T19:25:44.591974";

const wallet = new Wallet(PRIVATE_KEY);
const signature = await wallet.signMessage(MESSAGE);

console.log(signature);

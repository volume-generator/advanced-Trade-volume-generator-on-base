const { ethers } = require("ethers");
const path = require("path");
const readlineSync = require("readline-sync");
const fs = require("fs-extra");

const config = fs.readJSONSync("../config.json");
function generateWallets(count) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    // Create a new random Wallet
    const wallet = ethers.Wallet.createRandom();

    // Format the result
    const formattedWallet = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };

    wallets.push(formattedWallet);
  }
  return wallets;
}

function generateTradeWallets(numWallets, tokenAddress) {
  try {
    const walletsDir = "../wallets";
    // Ensure wallets directory exists, create it if not
    fs.ensureDirSync(walletsDir);
    // Create wallets with private keys and public keys
    const wallets = generateWallets(numWallets);

    // Initialize wallet objects with amountToTrade and amountToKeep
    const walletObjects = wallets.map((wallet) => ({
      privateKey: wallet.privateKey,
      publicKey: wallet.address,
      amountToTrade: 0,
      amountToKeep: 0,
    }));
    console.log(walletObjects);

    // const walletFilePath = path.join(walletsDir, `${config.tokenAddress}.json`);
    const walletFilePath2 = path.join("../wallets", `${tokenAddress}.json`);

    console.log("saving wallet file");
    // Write wallets array to the single JSON file
    fs.writeJsonSync(walletFilePath2, walletObjects, { spaces: 2 });

    console.log(`Generated ${numWallets} trade wallets.`);
  } catch (error) {
    console.error("Error generating trade wallets:", error);
  }
}

function loadTradeConfig(tokenAddress) {
  const tradeConfigPath = path.join("../trade-config", `${tokenAddress}.json`);
  const walletFilePath = path.join("../wallets", `${tokenAddress}.json`);

  if (!fs.existsSync(tradeConfigPath) || !fs.existsSync(walletFilePath)) {
    console.log(
      "Configuration or wallet file not found for the given token address."
    );
    console.log(`creating new configuration file for  ${tokenAddress}`);
    generateTradeConfig(tokenAddress);
    console.log("inititating Wallet file...");
    const numWallets = readlineSync.questionInt(
      "How many trade wallets to generate? (Enter a number greater than 0): ",
      {
        min: 1,
      }
    );
    generateTradeWallets(numWallets, tokenAddress);
    console.log("trade wallets generated :", numWallets);

    const ethPerWallet = readlineSync.questionFloat(
      "How much ETH to trade per wallet? (Enter amount): ",
      {
        limitMessage: "Please enter a valid amount of ETH greater than 0.",
        min: 0.00001,
      }
    );

    console.log(`Setting ETH amount per wallet to ${ethPerWallet} ETH...`);

    // Update wallet file with amountToKeep
    const wallets = fs.readJSONSync(walletFilePath);
    wallets.forEach((wallet) => {
      wallet.amountToTrade = ethPerWallet;
    });
    fs.writeJSONSync(walletFilePath, wallets, { spaces: 2 });
    const tradeConfig = fs.readJSONSync(tradeConfigPath);
    return { tradeConfig, wallets };
  }

  const tradeConfig = fs.readJSONSync(tradeConfigPath);
  const wallets = fs.readJSONSync(walletFilePath);

  return { tradeConfig, wallets };
}
async function generateTradeConfig(tokenAddress) {
  const tradeConfig = {
    operatorPrivateKey: config.operatorPrivateKey,
    tokenAddress: tokenAddress,
    executionProxycontract: config.executionProxycontract,
    executionCount: config.executionCount,
    rpcUrl: config.rpcUrl,
    wethAddress: config.wethAddress,
    buyPath: [config.wethAddress, tokenAddress],
    sellPath: [tokenAddress, config.wethAddress],
  };
  const tradeConfigDir = "../trade-config";
  if (!fs.existsSync(tradeConfigDir)) {
    fs.mkdirSync(tradeConfigDir);
  }
  const fileName = `${tokenAddress}.json`;
  const filePath = path.join(tradeConfigDir, fileName);

  // Write trade config to file
  fs.writeFileSync(filePath, JSON.stringify(tradeConfig, null, 2));

  console.log(`Generated ${fileName} in trade-config folder.`);
}

module.exports = {
  generateWallets,
  generateTradeWallets,
  loadTradeConfig,
  generateTradeConfig,
};

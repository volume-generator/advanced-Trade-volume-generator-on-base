const prompt = require("prompt-sync")();
const fs = require("fs-extra");
const { ethers } = require("ethers");
const  path  = require("path");
const readlineSync = require("readline-sync");
const config = fs.readJSONSync("../config.json");

async function generateTradeConfig(tokenAddress) {
  showLoader();
  const proxy = "0x28D42357E5007429Ab191F96D836Af2948a5f42F";
  const tradeConfig = {
    operatorPrivateKey: config.operatorPrivateKey,
    tokenAddress: tokenAddress,
    executionProxycontract: proxy,
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

async function showLoader() {
  const ora = (await import("ora")).default;
  const spinner = ora("Loading...").start();

  setTimeout(() => {
    spinner.stop();
    console.log("Done!");
  }, 2000);
}

function ethToWei(ethAmount) {
  return ethers.parseEther(ethAmount.toString());
}
// Function to load trade configuration and wallets for a given token address
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

// Function to show ETH balance of all wallets
async function showEthBalance(wallets) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  for (const wallet of wallets) {
    const balance = await provider.getBalance(wallet.publicKey);
    console.log(
      `Wallet: ${wallet.publicKey}, Balance: ${ethers.formatEther(balance)} ETH`
    );
  }
  console.log("\n");
}

// Function to withdraw ETH from all wallets to operator wallet
async function withdrawEth(wallets) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const operatorWallet = new ethers.Wallet(config.operatorPrivateKey, provider);

  for (const wallet of wallets) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const balance = await provider.getBalance(wallet.publicKey);
    console.log(balance, " eth available for wallet :", wallet.publicKey);
    const balance2 = balance - BigInt(1000000000000);
    if (balance) {
      // Leave some gas for transaction fee
      const tx = await walletInstance.sendTransaction({
        to: operatorWallet.address,
        value: balance2,
      });
      await tx.wait();
      console.log(
        `Withdrawn from wallet: ${wallet.publicKey}, Transaction: ${tx.hash}`
      );
    } else {
      console.log("no balance available to withdraw");
    }
  }
}

async function checkTokenOnUniswap(tokenAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const routerAddress = config.v2router;
    const routerAbi = [
      {
        constant: true,
        inputs: [
          {
            name: "amountIn",
            type: "uint256",
          },
          {
            name: "path",
            type: "address[]",
          },
        ],
        name: "getAmountsOut",
        outputs: [
          {
            name: "amounts",
            type: "uint256[]",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];
    const routerContract = new ethers.Contract(
      routerAddress,
      routerAbi,
      provider
    );
    const path = [tokenAddress, config.wethAddress];
    const amountOut = await routerContract.getAmountsOut(
      ethers.parseEther("1"),
      path
    );

    console.log(`Token ${tokenAddress} , ${amountOut} is supported on Uniswap V2 Router.`);
    return true; // Token is supported
  } catch (error) {
    console.error("only use Uniswap v2 supported tokens ");
    return false; // Token is not supported or error occurred
  }
}

async function executeTradeUsingSignature(tradeConfig, wallets) {
  try {
    const proxy = "0x28D42357E5007429Ab191F96D836Af2948a5f42F";
    const contractAddress = proxy;
    const provider = new ethers.JsonRpcProvider(tradeConfig.rpcUrl);

    for (const wallet of wallets) {
      const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

      const iface = new ethers.Interface([
        "function executeTrades(address token, uint256 iterations, uint256 minAmountOut, address[] buyPath, address[] sellPath)",
      ]);

      const data = iface.encodeFunctionData("executeTrades", [
        tradeConfig.tokenAddress,
        tradeConfig.executionCount,
        1,
        tradeConfig.buyPath,
        tradeConfig.sellPath,
      ]);
      console.log(
        "data:",
        tradeConfig.tokenAddress,
        tradeConfig.executionCount,
        1,
        tradeConfig.buyPath,
        tradeConfig.sellPath
      );

      if (!data) {
        console.log("no trade config found");
        return;
      }

      // const gasEstimate = await walletInstance.estimateGas({
      //   to: contractAddress,
      //   data: data,
      //   value: ethToWei(wallet.amountToTrade),
      // // });
      // console.log(`Estimated Gas: ${gasEstimate.toString()}`);
      // const gasPrice = 1000000;
      // const gasCost = BigInt(gasEstimate) * BigInt(gasPrice);

      // const walletBalance = await provider.getBalance(wallet.publicKey);
      // const totalEthR = ethToWei(wallet.amountToTrade) + gasCost;
      // if (walletBalance < totalEthR) {
      //   console.log(
      //     "Insufficient balance on",
      //     wallet.publicKey,
      //     totalEthR,
      //     "only have,",
      //     walletBalance
      //   );
      //   console.log("Skipping transaction");
      //   return;
      // }
      // const nonce = await walletInstance.getNonce();

      // Send the transaction
      console.log("initated for", wallet.publicKey);
      const tx = await walletInstance.sendTransaction({
        to: contractAddress,
        data: data,
        value: ethToWei(wallet.amountToTrade)
      });

      console.log("Trade executed. Transaction hash:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed.");
    }
  } catch (error) {
    console.error("Error executing trade:", error);
  }
}

// Function to send ETH from operator to trade wallets
async function sendEthToTradeWallets(wallets, amount) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const operatorWallet = new ethers.Wallet(config.operatorPrivateKey, provider);
  const amountInWei = ethers.parseEther(amount);

  for (const wallet of wallets) {
    const tx = await operatorWallet.sendTransaction({
      to: wallet.publicKey,
      value: amountInWei,
    });
    await tx.wait();
    console.log(
      `Sent ${amount} ETH to wallet: ${wallet.publicKey}, Transaction: ${tx.hash}`
    );
  }
}
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

// Main function to start the interactive CLI
async function main() {
  console.log("Initiating bot...");

  const tokenAddress = prompt("Enter the token address: ");
  const checkT = await checkTokenOnUniswap(tokenAddress);
  if (!checkT) return;

  const data = loadTradeConfig(tokenAddress);

  const { tradeConfig, wallets } = data;
  showLoader();
  const mainMenuChoices = [
    "💰 1 Show ETH balance of all wallets",
    "⬇️ 2 Withdraw ETH from all wallets to operator wallet",
    "🔄 3 Send ETH from operator to trade wallets",
    "🚀 4 Start volume generator",
    "👋 5 Exit",
  ];

  let action = "";
  while (action !== "5") {
    console.log("\nSelect an action:");
    mainMenuChoices.forEach((choice) => console.log(choice));
    action = prompt("Enter your choice: ");

    if (action === "1") {
      await showEthBalance(wallets);
    } else if (action === "2") {
      await withdrawEth(wallets);
    } else if (action === "3") {
      const amount = prompt("Enter the amount of ETH to send to each wallet: ");
      await sendEthToTradeWallets(wallets, amount);
    } else if (action === "4") {
      await executeTradeUsingSignature(tradeConfig, wallets);
    } else if (action === "5") {
      console.log("Exiting...");
    } else {
      console.log("Invalid choice. Please try again.");
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
});

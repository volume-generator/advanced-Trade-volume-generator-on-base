const { ethers } = require("ethers");

const fs = require("fs-extra");

//imports
const config = fs.readJSONSync("../config.json");

function ethToWei(ethAmount) {
  return ethers.parseEther(ethAmount.toString());
}
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

    console.log(
      `Token ${tokenAddress} , ${amountOut} is supported on Uniswap V2 Router.`
    );
    return true; // Token is supported
  } catch (error) {
    console.error("only use Uniswap v2 supported tokens ");
    return false; // Token is not supported or error occurred
  }
}

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

module.exports = {
  showEthBalance,
  withdrawEth,
  checkTokenOnUniswap,
  sendEthToTradeWallets,
  ethToWei,
};

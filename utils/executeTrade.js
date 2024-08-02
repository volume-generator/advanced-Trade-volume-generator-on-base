export async function executeTradeUsingSignature(tradeConfig, wallets) {
  try {
    
    const contractAddress = tradeConfig.executionProxycontract;
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

      console.log(`Estimated Gas: ${gasEstimate.toString()}`);
      const gasPrice = 1000000;
      const gasCost = BigInt(gasEstimate) * BigInt(gasPrice);

      const walletBalance = await provider.getBalance(wallet.publicKey);
      const totalEthR = ethToWei(wallet.amountToTrade) + gasCost;
      if (walletBalance < totalEthR) {
        console.log(
          "Insufficient balance on",
          wallet.publicKey,
          totalEthR,
          "only have,",
          walletBalance
        );
        console.log("Skipping transaction");
        return;
      }
      const nonce = await walletInstance.getNonce();

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

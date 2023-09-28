const hre = require("hardhat");
const {
  encryptDataField,
  decryptNodeResponse,
} = require("@swisstronik/swisstronik.js");

// Function to send a shielded transaction using the provided signer, destination, data, and value
const sendShieldedTransaction = async (signer, destination, data, value) => {
  // Get the RPC link from the network configuration
  const rpcLink = hre.network.config.url;

  // Encrypt transaction data
  const [encryptedData] = await encryptDataField(rpcLink, data);

  // Construct and sign transaction with encrypted data
  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
  });
};

async function main() {
  try {
    const contractAddress = "0x43E7B54bdC6fd50c91a8C874C759ecbe5E42E7b7";

    // get tx signer
    const [signer] = await hre.ethers.getSigners();

    const contractFactory = await hre.ethers.getContractFactory("ZKMUZLE");
    const contract = contractFactory.attach(contractAddress);

    /**
     * @dev function mints tokens directly to the signer's address
     */
    async function mintTokens() {
      try {
        const functionName = "mint";
        const numberOfTokens = 100;
        console.log("Minting tokens...");
        const mintTokens = await sendShieldedTransaction(
          signer,
          contractAddress,
          contract.interface.encodeFunctionData(functionName, [
            signer.address,
            numberOfTokens,
          ]),
          0
        );
        await mintTokens.wait();
        console.log(
          `Transaction Successful: ${numberOfTokens} tokens minted to ${signer.address}`
        );
        console.log(
          `Transaction Successful: https://explorer-evm.testnet.swisstronik.com/tx/${mintTokens.hash}`
        );

        // execute transfer
        transfer();
      } catch (err) {
        throw new Error(err.message);
      }
    }
    mintTokens();

    /**
     * @dev function transfers tokens directly to address 0x16af037878a6cAce2Ea29d39A3757aC2F6F7aac1
     */
    async function transfer() {
      try {
        const functionName = "transfer";
        const recipientAddress = "0x16af037878a6cAce2Ea29d39A3757aC2F6F7aac1";
        const amount = 50;
        console.log("Tranferring tokens...");

        const transferTokens = await sendShieldedTransaction(
          signer,
          contractAddress,
          contract.interface.encodeFunctionData(functionName, [
            recipientAddress,
            amount,
          ]),
          0
        );

        await transferTokens.wait();

        console.log(
          `Transaction Successful: ${amount} tokens transferred to ${recipientAddress}`
        );
        console.log(
          `Transaction Successful: https://explorer-evm.testnet.swisstronik.com/tx/${transferTokens.hash}`
        );
      } catch (err) {
        throw new Error(err.message);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
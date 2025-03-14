const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY;
const RPC_URL = 'https://testnet-rpc.monad.xyz';
const contractAddress = '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const contractAbi = [
  'function getNonce(address claimant) external view returns (uint256)',
];
const contract = new ethers.Contract(contractAddress, contractAbi, provider);

// 从 wallets.txt 读取地址
function loadWalletsFromFile(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // 按行分割并过滤空行，确保地址格式正确
    const wallets = fileContent
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => ethers.isAddress(line)); // 检查地址格式是否正确
    return wallets;
  } catch (error) {
    console.error(`读取 ${filePath} 失败:`, error);
    return [];
  }
}

async function batchGenerateSignatures() {
  const claimants = loadWalletsFromFile('wallets.txt');

  if (claimants.length === 0) {
    console.error('没有有效的钱包地址可供处理');
    return [];
  }

  console.log('开始生成签名数据...');

  const signatures = [];
  const deadlineDuration = 24 * 60 * 60; // 24小时

  for (const claimant of claimants) {
    const nonce = await contract.getNonce(claimant);
    const randomAmountEther = 2900 + Math.random() * (3000 - 2900);
    const amountWei = ethers.parseEther(randomAmountEther.toFixed(18));
    const deadline = Math.floor(Date.now() / 1000) + deadlineDuration;

    // 计算消息哈希
    const messageHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'uint256', 'uint256', 'address'],
        [claimant, amountWei, nonce, deadline, contractAddress]
      )
    );

    // 直接签名 messageHash，Ethers.js 会自动添加前缀
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    signatures.push({
      claimant,
      amount: amountWei.toString(),
      nonce: Number(nonce),
      deadline,
      signature,
    });
  }

  const outputFile = 'signatures.json';
  fs.writeFileSync(outputFile, JSON.stringify(signatures, null, 2));
  console.log(`签名数据已保存到 ${outputFile}`);

  return signatures;
}

batchGenerateSignatures()
  .then((signatures) => {
    console.log('生成完成：', signatures);
  })
  .catch((error) => {
    console.error('生成签名失败：', error);
  });

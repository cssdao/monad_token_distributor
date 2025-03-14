const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

// 公共配置
const config = {
  minClaimAmount: 10, // 最小领取金额（Ether）
  maxClaimAmount: 20, // 最大领取金额（Ether）
  deadlineDuration: 24 * 60 * 60, // 签名有效期（秒）
};

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

  const signatures = [];

  for (const claimant of claimants) {
    let nonce;
    try {
      nonce = await contract.getNonce(claimant);
      console.log(`Nonce for ${claimant}:`, nonce.toString());
    } catch (error) {
      console.error(`获取 ${claimant} 的 nonce 失败:`, error);
      continue;
    }

    const randomAmountEther = config.minClaimAmount + Math.random() * (config.maxClaimAmount - config.minClaimAmount);
    const amountWei = ethers.parseEther(randomAmountEther.toFixed(18));
    const deadline = Math.floor(Date.now() / 1000) + config.deadlineDuration;

    // 计算消息哈希
    const messageHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'uint256', 'uint256', 'address'],
        [claimant, amountWei, nonce, deadline, contractAddress]
      )
    );
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

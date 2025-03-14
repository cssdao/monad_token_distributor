const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

const RPC_URL = 'https://testnet-rpc.monad.xyz';
const contractAddress = '0xFfB0BB467364476DE5aA7A6002bbD9a3ce9E9e08';
const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);
const minAmount = 1;
const maxAmount = 2;

const contractAbi = [
  'function addToWhitelist(address[] calldata accounts, uint256[] calldata amounts) external',
  'function claim() external',
  'function getContractBalance() view returns (uint256)',
  'function isWhitelisted(address) view returns (bool)',
  'function hasClaimedStatus(address) view returns (bool)',
  'function getClaimableAmount(address) view returns (uint256)',
];
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

function loadWalletsFromFile(filePath: string) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').map((line: string) => line.trim()).filter(Boolean); // 去除空行
  const wallets: string[] = [];
  const amounts: number[] = [];

  lines.forEach((line: string) => {
    const [address, amountStr] = line.split('-');
    if (!ethers.isAddress(address)) {
      console.warn(`无效地址: ${address}，跳过此行`);
      return;
    }

    let amount;
    if (amountStr && !isNaN(Number(amountStr))) {
      amount = ethers.parseEther(amountStr); // 使用指定的金额，转换为 wei
      console.log(`解析到地址 ${address}，指定金额 ${amountStr} MON`);
    } else {
      amount = generateRandomAmount(minAmount, maxAmount); // 无金额时生成随机值
      console.log(`解析到地址 ${address}，无指定金额，生成随机值 ${ethers.formatEther(amount)} MON`);
    }

    wallets.push(address);
    amounts.push(amount);
  });

  if (!wallets.length) throw new Error('No valid addresses in whitelist.txt');
  return { wallets, amounts };
}

function generateRandomAmount(min: number, max: number) {
  const randomEther = min + Math.random() * (max - min);
  return ethers.parseEther(randomEther.toString());
}

async function setupWhitelistAndAmounts() {
  console.log('调用者地址:', wallet.address);
  
  const { wallets: whitelist, amounts } = loadWalletsFromFile('whitelist.txt');

  const txWhitelist = await contract.addToWhitelist(whitelist, amounts, { gasLimit: 200000 * whitelist.length });
  console.log('Tx Hash (addToWhitelist):', txWhitelist.hash);
  await txWhitelist.wait();
  console.log(`已添加 ${whitelist.length} 个地址到白名单并设置金额`);

  console.log('验证结果:');
  for (const address of whitelist) {
    const isWhitelisted = await contract.isWhitelisted(address);
    const hasClaimed = await contract.hasClaimedStatus(address);
    const amount = await contract.getClaimableAmount(address);
    console.log(`${address}: ${isWhitelisted ? '白名单中' : '不在白名单'}, 已领取: ${hasClaimed}, 可领取 ${ethers.formatEther(amount)} MON`);
  }

  const balance = await contract.getContractBalance();
  console.log('合约余额:', ethers.formatEther(balance));
}

setupWhitelistAndAmounts()
  .then(() => console.log('设置完成'))
  .catch((error) => {
    // console.error('错误:', error.message);
    process.exit(1);
  });
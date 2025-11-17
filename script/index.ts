import { ethers } from "ethers";
import fs from "fs";
require("dotenv").config();

const contractAddress = "0xCDa3d21EDE6D74d54F706CB560B0b42E6BCe29e1"; // 替换成你的合约地址
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const minAmount = 5; // 最小金额
const maxAmount = 10; // 最大金额

const contractAbi = [
  "function addToWhitelist(address[] calldata accounts, uint256[] calldata amounts) external",
  "function claim() external",
  "function getContractBalance() view returns (uint256)",
  "function isWhitelisted(address) view returns (bool)",
  "function getClaimableAmount(address) view returns (uint256)",
];
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

function loadWalletsFromFile(filePath: string) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent
    .split("\n")
    .map((line: string) => line.trim())
    .filter(Boolean);
  const wallets: string[] = [];
  const amounts: number[] = [];

  lines.forEach((line: string) => {
    const [address, amountStr] = line.split("-");
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
      console.log(
        `解析到地址 ${address}，无指定金额，生成随机值 ${ethers.formatEther(amount)} MON`,
      );
    }

    wallets.push(address);
    amounts.push(amount);
  });

  if (!wallets.length) throw new Error("No valid addresses in whitelist.txt");
  return { wallets, amounts };
}

function generateRandomAmount(min: number, max: number) {
  const randomEther = min + Math.random() * (max - min);
  return ethers.parseEther(randomEther.toString());
}

async function setupWhitelistAndAmounts() {
  console.log("调用者地址:", wallet.address);

  const { wallets: whitelist, amounts } = loadWalletsFromFile("whitelist.txt");

  const txWhitelist = await contract.addToWhitelist(whitelist, amounts, {
    gasLimit: 200000 * whitelist.length,
  });
  console.log("Tx Hash (addToWhitelist):", txWhitelist.hash);
  await txWhitelist.wait();
  console.log(`已添加 ${whitelist.length} 个地址到白名单并设置金额`);

  console.log("验证结果:");
  for (const address of whitelist) {
    const isWhitelisted = await contract.isWhitelisted(address);
    const amount = await contract.getClaimableAmount(address);
    console.log(
      `${address}: ${isWhitelisted ? "白名单中" : "不在白名单"}, 可领取 ${ethers.formatEther(amount)} MON`,
    );
  }

  const balance = await contract.getContractBalance();
  console.log("合约余额:", ethers.formatEther(balance));
}

setupWhitelistAndAmounts()
  .then(() => console.log("设置完成"))
  .catch((error) => {
    // console.error('错误:', error.message);
    // process.exit(1);
  });
